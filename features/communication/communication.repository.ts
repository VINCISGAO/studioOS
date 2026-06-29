import { randomUUID } from "crypto";
import type { CommunicationMessage, CommunicationSourceType } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { CommunicationTodo } from "@/features/communication/communication.types";

export class CommunicationRepository {
  async create(input: {
    campaignId?: string | null;
    senderId: string;
    receiverId?: string | null;
    sourceType: CommunicationSourceType;
    sourceRefId?: string | null;
    originalLanguage: string;
    targetLanguage: string;
    originalContent: string;
    localizedContent?: string | null;
    summary?: string | null;
    todos?: CommunicationTodo[];
    detectConfidence?: number | null;
    translationAvailable?: boolean;
  }) {
    return prisma.communicationMessage.create({
      data: {
        campaignId: input.campaignId ?? undefined,
        senderId: input.senderId,
        receiverId: input.receiverId ?? undefined,
        sourceType: input.sourceType,
        sourceRefId: input.sourceRefId ?? undefined,
        originalLanguage: input.originalLanguage,
        targetLanguage: input.targetLanguage,
        originalContent: input.originalContent,
        localizedContent: input.localizedContent,
        summary: input.summary,
        todosJson: input.todos?.length ? input.todos : undefined,
        detectConfidence: input.detectConfidence ?? undefined,
        translationAvailable: input.translationAvailable ?? true
      },
      include: { sender: true, receiver: true }
    });
  }

  async findById(id: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.communicationMessage.findFirst({
      where: { id, deletedAt: null },
      include: { sender: true, receiver: true, translationLogs: { orderBy: { createdAt: "desc" }, take: 5 } }
    });
  }

  async findBySource(sourceType: CommunicationSourceType, sourceRefId: string) {
    return prisma.communicationMessage.findFirst({
      where: { sourceType, sourceRefId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { sender: true, receiver: true }
    });
  }

  async listCampaignMessages(campaignId: string, opts?: { sourceType?: CommunicationSourceType; since?: Date }) {
    return prisma.communicationMessage.findMany({
      where: {
        campaignId,
        deletedAt: null,
        ...(opts?.sourceType ? { sourceType: opts.sourceType } : {}),
        ...(opts?.since ? { createdAt: { gt: opts.since } } : {})
      },
      orderBy: { createdAt: "asc" },
      include: { sender: true, receiver: true }
    });
  }

  async pollSince(campaignId: string, since: Date) {
    return prisma.communicationMessage.findMany({
      where: { campaignId, deletedAt: null, updatedAt: { gt: since } },
      orderBy: { updatedAt: "asc" },
      include: { sender: true, receiver: true }
    });
  }

  async updateTodos(messageId: string, todos: CommunicationTodo[]) {
    return prisma.communicationMessage.update({
      where: { id: messageId },
      data: { todosJson: todos, updatedAt: new Date() }
    });
  }

  async updateLocalization(
    messageId: string,
    data: Partial<{
      localizedContent: string;
      summary: string | null;
      todos: CommunicationTodo[];
      translationAvailable: boolean;
    }>
  ) {
    return prisma.communicationMessage.update({
      where: { id: messageId },
      data: {
        localizedContent: data.localizedContent,
        summary: data.summary,
        todosJson: data.todos,
        translationAvailable: data.translationAvailable,
        updatedAt: new Date()
      }
    });
  }

  async logTranslation(input: {
    messageId: string;
    model: string;
    provider: string;
    sourceLang: string;
    targetLang: string;
    promptVersion: string;
    tokenInput: number;
    tokenOutput: number;
    cost: number;
    latencyMs: number;
    attempt: number;
    success: boolean;
    error?: string;
  }) {
    return prisma.communicationTranslationLog.create({ data: input });
  }

  todosFromMessage(message: CommunicationMessage): CommunicationTodo[] {
    const raw = message.todosJson;
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
      const row = item as { id?: string; text?: string; done?: boolean };
      return {
        id: row.id ?? randomUUID(),
        text: String(row.text ?? ""),
        done: Boolean(row.done)
      };
    });
  }
}

export const communicationRepository = new CommunicationRepository();
