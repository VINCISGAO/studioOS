import { randomUUID } from "crypto";
import type { CommunicationMessage, CommunicationSourceType } from "@prisma/client";
import { communicationAiService } from "@/features/communication/communication-ai.service";
import { communicationRepository } from "@/features/communication/communication.repository";
import type { CommunicationTodo } from "@/features/communication/communication.types";
import { CommunicationEvents } from "@/features/shared/types/events";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { PermissionService, type AuthUser } from "@/features/auth/permission.service";
import { publishEvent } from "@/lib/core/event-bus";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { memoryService } from "@/features/memory/memory.service";
import { communicationConfig, languageDisplay, normalizeLanguageCode } from "@/lib/core/config/communication";

function todosFromStrings(items: string[]): CommunicationTodo[] {
  return items.map((text) => ({ id: randomUUID(), text, done: false }));
}

export class CommunicationService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  private async resolveTargetLanguage(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { language: true } });
    return normalizeLanguageCode(user?.language);
  }

  private async resolveCounterparty(campaignId: string, senderId: string) {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return null;
    if (campaign.brandId === senderId) return campaign.creatorId;
    if (campaign.creatorId === senderId) return campaign.brandId;
    return campaign.brandId === senderId ? campaign.creatorId : campaign.brandId;
  }

  async localizeAndStore(input: {
    campaignId?: string | null;
    senderId: string;
    receiverId?: string | null;
    sourceType: CommunicationSourceType;
    sourceRefId?: string | null;
    content: string;
    targetLanguage: string;
    context?: string;
    senderRole?: string;
  }) {
    this.assertDb();

    const existing =
      input.sourceRefId &&
      (await communicationRepository.findBySource(input.sourceType, input.sourceRefId));
    if (existing) return existing;

    const draft = await communicationRepository.create({
      campaignId: input.campaignId,
      senderId: input.senderId,
      receiverId: input.receiverId,
      sourceType: input.sourceType,
      sourceRefId: input.sourceRefId,
      originalLanguage: "pending",
      targetLanguage: normalizeLanguageCode(input.targetLanguage),
      originalContent: input.content,
      translationAvailable: false
    });

    const memoryCtx = await memoryService.buildContext({
      campaignId: input.campaignId,
      brandId: input.senderRole?.toUpperCase() === "BRAND" ? input.senderId : undefined,
      creatorId: input.senderRole?.toUpperCase() === "CREATOR" ? input.senderId : undefined,
      viewerUserId: input.receiverId ?? input.senderId,
      messageContent: input.content
    });

    const contentForAi = memoryCtx.resolvedMessage ?? input.content;

    const processed = await communicationAiService.processMessage({
      content: contentForAi,
      targetLanguage: input.targetLanguage,
      sourceType: input.sourceType,
      context: input.context,
      senderRole: input.senderRole,
      memoryContext: memoryService.formatContextForPrompt(memoryCtx),
      neverUseEmojis: memoryCtx.neverUseEmojis,
      tone: memoryCtx.tone
    });

    const todos = todosFromStrings(processed.result.todos);
    await prisma.communicationMessage.update({
      where: { id: draft.id },
      data: {
        originalLanguage: processed.result.language,
        detectConfidence: processed.result.confidence,
        localizedContent: processed.failed ? input.content : processed.result.localizedContent,
        summary: processed.result.summary,
        todosJson: todos,
        translationAvailable: !processed.failed
      }
    });

    await communicationRepository.logTranslation({
      messageId: draft.id,
      model: processed.model,
      provider: processed.provider,
      sourceLang: processed.result.language,
      targetLang: normalizeLanguageCode(input.targetLanguage),
      promptVersion: communicationConfig.promptVersion,
      tokenInput: processed.tokenInput,
      tokenOutput: processed.tokenOutput,
      cost: processed.cost,
      latencyMs: processed.latencyMs,
      attempt: processed.attempts,
      success: !processed.failed,
      error: processed.error
    });

    const saved = await communicationRepository.findById(draft.id);
    if (!saved) throw appError("SYSTEM_ERROR", "Failed to save communication message");

    void memoryService
      .processMessageMemory({
        content: input.content,
        senderId: input.senderId,
        senderRole: input.senderRole ?? "BRAND",
        campaignId: input.campaignId,
        sourceRefId: draft.id
      })
      .catch(() => undefined);

    await this.publishCommunicationEvents(saved, processed.failed);
    return saved;
  }

  private async publishCommunicationEvents(message: CommunicationMessage, translationFailed: boolean) {
    const base = {
      aggregateType: "notification" as const,
      aggregateId: message.id,
      payload: { messageId: message.id, campaignId: message.campaignId },
      occurredAt: new Date().toISOString(),
      actorId: message.senderId
    };

    await publishEvent({ ...base, name: CommunicationEvents.MESSAGE_CREATED });
    await publishEvent({ ...base, name: CommunicationEvents.MESSAGE_TRANSLATED });

    if (message.summary) {
      await publishEvent({ ...base, name: CommunicationEvents.SUMMARY_GENERATED });
    }
    if (message.todosJson) {
      await publishEvent({ ...base, name: CommunicationEvents.TODO_GENERATED });
    }

    if (translationFailed && message.receiverId) {
      await prisma.notification.create({
        data: {
          userId: message.receiverId,
          campaignId: message.campaignId ?? undefined,
          channel: "IN_APP",
          priority: "NORMAL",
          title: "Translation temporarily unavailable",
          content: "Showing original message while AI localization retries.",
          actionUrl: message.campaignId ? `/brand/projects/${message.campaignId}` : undefined
        }
      });
    }
  }

  async sendCampaignMessage(campaignId: string, user: AuthUser, content: string, receiverId?: string) {
    this.assertDb();
    PermissionService.assert(user, "campaign.read");
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    const counterpartyId = receiverId ?? (await this.resolveCounterparty(campaignId, user.id));
    if (!counterpartyId) throw appError("VALIDATION_ERROR", "No counterparty on campaign");

    const targetLanguage = await this.resolveTargetLanguage(counterpartyId);
    const message = await this.localizeAndStore({
      campaignId,
      senderId: user.id,
      receiverId: counterpartyId,
      sourceType: "CHAT",
      content,
      targetLanguage,
      context: `Campaign "${campaign.title}" chat`,
      senderRole: user.role
    });

    return this.serializeForViewer(message, user);
  }

  async listCampaignMessages(campaignId: string, user: AuthUser, opts?: { since?: string }) {
    this.assertDb();
    PermissionService.assert(user, "campaign.read");
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    const since = opts?.since ? new Date(opts.since) : undefined;
    const messages = await communicationRepository.listCampaignMessages(campaignId, {
      sourceType: "CHAT",
      since
    });
    return messages.map((m) => this.serializeForViewer(m, user));
  }

  async pollCampaignStream(campaignId: string, user: AuthUser, since: string) {
    this.assertDb();
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    const items = await communicationRepository.pollSince(campaignId, new Date(since));
    return items.map((m) => this.serializeForViewer(m, user));
  }

  async translateText(user: AuthUser, input: {
    content: string;
    targetLanguage: string;
    sourceType: CommunicationSourceType;
    campaignId?: string;
    context?: string;
  }) {
    this.assertDb();
    PermissionService.assert(user, "campaign.read");

    const message = await this.localizeAndStore({
      campaignId: input.campaignId,
      senderId: user.id,
      sourceType: input.sourceType,
      content: input.content,
      targetLanguage: input.targetLanguage,
      context: input.context,
      senderRole: user.role
    });

    return this.serializeForViewer(message, user, "dual");
  }

  async summarizeText(user: AuthUser, content: string, targetLanguage?: string) {
    PermissionService.assert(user, "campaign.read");
    const summary = await communicationAiService.summarize(content, targetLanguage);
    return { summary };
  }

  async extractTodos(user: AuthUser, content: string, targetLanguage?: string) {
    PermissionService.assert(user, "campaign.read");
    const todos = await communicationAiService.extractTodos(content, targetLanguage);
    return { todos };
  }

  async updateTodo(messageId: string, user: AuthUser, todoId: string, done: boolean) {
    this.assertDb();
    const message = await communicationRepository.findById(messageId);
    if (!message) throw appError("NOT_FOUND", "Message not found");
    if (message.senderId !== user.id && message.receiverId !== user.id && user.role !== "ADMIN") {
      throw appError("FORBIDDEN", "Not allowed to update todos on this message");
    }

    const todos = communicationRepository.todosFromMessage(message);
    const next = todos.map((t) => (t.id === todoId ? { ...t, done } : t));
    await communicationRepository.updateTodos(messageId, next);
    return { todos: next };
  }

  async getLocalizedContentForSource(input: {
    sourceType: CommunicationSourceType;
    sourceRefId: string;
    originalContent: string;
    viewerUserId: string;
    campaignId?: string;
    senderId: string;
    receiverId?: string;
    context?: string;
    senderRole?: string;
  }) {
    const existing = await communicationRepository.findBySource(input.sourceType, input.sourceRefId);
    if (existing) {
      const viewer = { id: input.viewerUserId, role: "BRAND" } as AuthUser;
      return this.serializeForViewer(existing, viewer);
    }

    const targetLanguage = await this.resolveTargetLanguage(input.viewerUserId);
    const message = await this.localizeAndStore({
      campaignId: input.campaignId,
      senderId: input.senderId,
      receiverId: input.receiverId,
      sourceType: input.sourceType,
      sourceRefId: input.sourceRefId,
      content: input.originalContent,
      targetLanguage,
      context: input.context,
      senderRole: input.senderRole
    });

    const viewer = { id: input.viewerUserId, role: "BRAND" } as AuthUser;
    return this.serializeForViewer(message, viewer);
  }

  serializeForViewer(
    message: CommunicationMessage & { sender?: { fullName: string; email: string }; receiver?: { fullName: string; email: string } | null },
    user: AuthUser,
    viewMode: "localized" | "original" | "dual" = "localized"
  ) {
    const isAdmin = user.role === "ADMIN" || user.role === "SUPPORT";
    const isSender = message.senderId === user.id;
    const showOriginal = viewMode === "original" || (viewMode === "dual" && isAdmin);
    const lang = languageDisplay(message.originalLanguage);

    const todos = communicationRepository.todosFromMessage(message);

    return {
      id: message.id,
      campaignId: message.campaignId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      sourceType: message.sourceType,
      sourceRefId: message.sourceRefId,
      sender: message.sender
        ? { name: message.sender.fullName, email: message.sender.email }
        : undefined,
      language: {
        code: message.originalLanguage,
        label: lang.label,
        flag: lang.flag,
        confidence: message.detectConfidence != null ? Number(message.detectConfidence) : null
      },
      targetLanguage: message.targetLanguage,
      autoLocalized: message.translationAvailable,
      displayContent: showOriginal
        ? message.originalContent
        : message.localizedContent ?? message.originalContent,
      originalContent: isAdmin || isSender ? message.originalContent : undefined,
      localizedContent: message.localizedContent,
      summary: message.summary,
      todos,
      translationUnavailable: !message.translationAvailable,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString()
    };
  }
}

export const communicationService = new CommunicationService();
