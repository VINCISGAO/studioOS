import type { AuthUserDto } from "@/features/auth/auth.service";
import { aiCopilotService } from "@/features/ai-copilot/ai-copilot.service";
import { aiCopilotRepository } from "@/features/ai-copilot/ai-copilot.repository";
import type { AiCopilotFeedbackRating } from "@/features/ai-copilot/ai-copilot.types";
import { normalizeCopilotRole } from "@/features/ai-copilot/ai-copilot.types";
import { canvasChatImageService } from "@/features/canvas/canvas-chat-image.service";
import { canvasPromptEnhanceService } from "@/features/canvas/canvas-prompt-enhance.service";
import { recordGptPromptLucienLearning } from "@/features/ai-copilot/gpt-prompt-lucien-learning.service";
import { canvasService } from "@/features/canvas/canvas.service";
import {
  formatCanvasChatHistoryForModel,
  parseCanvasChatMetadata,
  serializeCanvasChatMessage
} from "@/lib/canvas/canvas-chat-history";
import { wantsCanvasChatImageGeneration } from "@/lib/canvas/chat-image-intent";
import {
  extractPromptSourceFromChatMessage,
  resolveCanvasChatPromptField,
  wantsCanvasChatPromptEnhancement
} from "@/lib/canvas/chat-prompt-intent";
import {
  canvasChatMemoryExpiresAt,
  canvasChatMemorySince,
  CANVAS_CHAT_MEMORY_HOURS
} from "@/lib/canvas/chat-memory";
import { appError } from "@/lib/core/errors";
import { asInputJson } from "@/lib/core/prisma-json";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";

function localeFromLanguageCode(languageCode?: string | null): "zh" | "en" {
  const normalized = normalizeLanguageCode(languageCode ?? "en");
  return normalized.startsWith("zh") ? "zh" : "en";
}

export class CanvasChatService {
  async getHistory(user: AuthUserDto, projectId: string) {
    await canvasService.assertAccess(projectId, user);
    if (!aiCopilotRepository.isEnabled()) {
      return {
        sessionId: null,
        memoryHours: CANVAS_CHAT_MEMORY_HOURS,
        expiresAt: null,
        messages: [] as ReturnType<typeof serializeCanvasChatMessage>[]
      };
    }

    const since = canvasChatMemorySince();
    const session = await aiCopilotRepository.findRecentCanvasSession(user.id, projectId, since);
    if (!session) {
      return {
        sessionId: null,
        memoryHours: CANVAS_CHAT_MEMORY_HOURS,
        expiresAt: null,
        messages: []
      };
    }

    const rows = await aiCopilotRepository.listSessionMessagesSince(session.id, since);
    return {
      sessionId: session.id,
      title: session.title,
      memoryHours: CANVAS_CHAT_MEMORY_HOURS,
      expiresAt: canvasChatMemoryExpiresAt(session.updatedAt).toISOString(),
      messages: rows
        .filter((message) => message.role === "USER" || message.role === "ASSISTANT")
        .map(serializeCanvasChatMessage)
    };
  }

  async resetSession(user: AuthUserDto, projectId: string, sessionId?: string | null) {
    await canvasService.assertAccess(projectId, user);
    if (!sessionId || !aiCopilotRepository.isEnabled()) {
      return { closed: false };
    }

    const session = await aiCopilotRepository.getSession(sessionId);
    if (!session || session.userId !== user.id) {
      throw appError("NOT_FOUND", "AI Copilot session not found");
    }

    await aiCopilotRepository.closeSession(session.id);
    return { closed: true };
  }

  async chat(
    user: AuthUserDto,
    input: {
      projectId: string;
      message: string;
      sessionId?: string | null;
      languageCode?: string | null;
      referenceAssetId?: string | null;
    }
  ) {
    await canvasService.assertAccess(input.projectId, user);

    if (input.referenceAssetId?.trim() || wantsCanvasChatImageGeneration(input.message)) {
      return canvasChatImageService.generateFromChat(user, input);
    }

    if (wantsCanvasChatPromptEnhancement(input.message)) {
      return this.chatPromptEnhance(user, input);
    }

    const locale = localeFromLanguageCode(input.languageCode);
    const trimmedMessage = input.message.trim();
    let conversationContext: string | null = null;
    if (input.sessionId && aiCopilotRepository.isEnabled()) {
      const since = canvasChatMemorySince();
      const priorMessages = await aiCopilotRepository.listSessionMessagesSince(
        input.sessionId,
        since
      );
      const historyBlock = formatCanvasChatHistoryForModel(priorMessages, locale);
      if (historyBlock) conversationContext = historyBlock;
    }

    const answer = await aiCopilotService.answer(user, {
      message: trimmedMessage,
      conversationContext,
      sessionId: input.sessionId,
      pagePath: `/studio/canvas/${input.projectId}`,
      entityType: "canvas",
      entityId: input.projectId,
      languageCode: input.languageCode
    });

    return answer;
  }

  private async chatPromptEnhance(
    user: AuthUserDto,
    input: {
      projectId: string;
      message: string;
      sessionId?: string | null;
      languageCode?: string | null;
    }
  ) {
    if (!aiCopilotRepository.isEnabled()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }

    const trimmedMessage = input.message.trim();
    const role = normalizeCopilotRole(user);
    const pagePath = `/studio/canvas/${input.projectId}`;
    const field = resolveCanvasChatPromptField(trimmedMessage);
    const sourceText = extractPromptSourceFromChatMessage(trimmedMessage);

    const session = input.sessionId
      ? await aiCopilotRepository.getSession(input.sessionId)
      : await aiCopilotRepository.createSession({
          userId: user.id,
          role,
          title: trimmedMessage.slice(0, 80)
        });

    if (!session || session.userId !== user.id) {
      throw appError("NOT_FOUND", "AI Copilot session not found");
    }

    await aiCopilotRepository.createMessage({
      sessionId: session.id,
      userId: user.id,
      role: "USER",
      content: trimmedMessage,
      metadataJson: asInputJson({
        pagePath,
        entityType: "canvas",
        entityId: input.projectId,
        languageCode: input.languageCode ?? null,
        promptEnhanceField: field
      })
    });

    const enhanced = await canvasPromptEnhanceService.enhance(user, {
      projectId: input.projectId,
      field,
      text: sourceText,
      languageCode: input.languageCode,
      learningContext: {
        sessionId: session.id,
        pagePath,
        recordLearning: false
      }
    });

    const assistantMessage = await aiCopilotRepository.createMessage({
      sessionId: session.id,
      userId: null,
      role: "ASSISTANT",
      content: enhanced.text,
      metadataJson: asInputJson({
        answerMode: enhanced.answerMode,
        promptAuthor: enhanced.promptAuthor,
        lucienRole: "learning_only",
        gptModel: enhanced.model,
        gptProvider: enhanced.provider,
        pagePath,
        entityType: "canvas",
        entityId: input.projectId
      })
    });
    await aiCopilotRepository.touchSession(session.id);

    await recordGptPromptLucienLearning({
      user,
      projectId: input.projectId,
      campaignId: enhanced.campaignId,
      field,
      sourceText,
      gptPrompt: enhanced.text,
      model: enhanced.model,
      provider: enhanced.provider,
      languageCode: normalizeLanguageCode(input.languageCode ?? user.languageCode ?? "en"),
      pagePath,
      sessionId: session.id,
      messageId: assistantMessage.id
    });

    return {
      sessionId: session.id,
      messageId: assistantMessage.id,
      answer: enhanced.text,
      suggestedQuestions: [],
      context: {
        pagePath,
        entityType: "canvas",
        entityId: input.projectId,
        languageCode: input.languageCode ?? null
      },
      toolCalls: [],
      answerMode: enhanced.answerMode,
      modelConfigured: true,
      participants: ["gpt", "lucien_learning"] as const,
      promptAuthor: "gpt" as const
    };
  }

  async recordFeedback(
    user: AuthUserDto,
    input: {
      projectId: string;
      messageId: string;
      rating: AiCopilotFeedbackRating;
      languageCode?: string | null;
    }
  ) {
    await canvasService.assertAccess(input.projectId, user);
    if (!aiCopilotRepository.isEnabled()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }

    const message = await aiCopilotRepository.getMessageWithSession(input.messageId);
    if (!message || message.session.userId !== user.id || message.role !== "ASSISTANT") {
      throw appError("NOT_FOUND", "AI assistant message not found");
    }

    const sessionMessages = await aiCopilotRepository.listSessionMessagesSince(
      message.sessionId,
      new Date(0)
    );
    const belongsToProject = sessionMessages.some((row) => {
      const meta = parseCanvasChatMetadata(row.metadataJson);
      return meta.entityType === "canvas" && meta.entityId === input.projectId;
    });
    if (!belongsToProject) {
      throw appError("NOT_FOUND", "Canvas chat message not found");
    }

    return aiCopilotService.recordFeedback(user, {
      messageId: input.messageId,
      rating: input.rating,
      languageCode: input.languageCode
    });
  }
}

export const canvasChatService = new CanvasChatService();
