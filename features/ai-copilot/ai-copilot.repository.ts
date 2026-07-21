import type { Prisma } from "@prisma/client";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import {
  LUCIEN_KNOWLEDGE_SCOPE_FILTERS,
  type LucienKnowledgeRetrievalScope
} from "@/features/ai-copilot/lucien-knowledge-scope";

export class AiCopilotRepository {
  isEnabled() {
    return hasDatabaseUrl();
  }

  getSession(sessionId: string) {
    return prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 30 }
      }
    });
  }

  findRecentCanvasSession(userId: string, projectId: string, since: Date) {
    return prisma.chatSession.findFirst({
      where: {
        userId,
        status: "OPEN",
        updatedAt: { gte: since },
        messages: {
          some: {
            createdAt: { gte: since },
            metadataJson: {
              path: ["entityId"],
              equals: projectId
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  listSessionMessagesSince(sessionId: string, since: Date) {
    return prisma.chatMessage.findMany({
      where: {
        sessionId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: "asc" }
    });
  }

  closeSession(sessionId: string) {
    return prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: "CLOSED" }
    });
  }

  getMessageWithSession(messageId: string) {
    return prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { session: true }
    });
  }

  listSessionsForUser(userId: string, limit = 10) {
    return prisma.chatSession.findMany({
      where: { userId, status: "OPEN" },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" },
      take: limit
    });
  }

  createSession(input: { userId: string; role: string; title?: string | null }) {
    return prisma.chatSession.create({
      data: {
        userId: input.userId,
        role: input.role,
        title: input.title ?? null
      }
    });
  }

  touchSession(sessionId: string, title?: string | null) {
    return prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        ...(title ? { title } : {}),
        updatedAt: new Date()
      }
    });
  }

  createMessage(input: {
    sessionId: string;
    userId?: string | null;
    role: string;
    content: string;
    metadataJson?: Prisma.InputJsonValue;
  }) {
    return prisma.chatMessage.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId ?? null,
        role: input.role,
        content: input.content,
        metadataJson: asInputJson(input.metadataJson)
      }
    });
  }

  updateMessageMetadata(messageId: string, metadataJson: Prisma.InputJsonValue) {
    return prisma.chatMessage.update({
      where: { id: messageId },
      data: { metadataJson: asInputJson(metadataJson) }
    });
  }

  createToolCall(input: {
    sessionId: string;
    messageId?: string | null;
    toolName: string;
    inputJson?: Prisma.InputJsonValue;
    outputJson?: Prisma.InputJsonValue;
    status: string;
    durationMs?: number | null;
  }) {
    return prisma.aiToolCall.create({
      data: {
        sessionId: input.sessionId,
        messageId: input.messageId ?? null,
        toolName: input.toolName,
        inputJson: asInputJson(input.inputJson),
        outputJson: asInputJson(input.outputJson),
        status: input.status,
        durationMs: input.durationMs ?? null
      }
    });
  }

  createContext(input: {
    sessionId: string;
    userId: string;
    role: string;
    pagePath?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    contextJson: Prisma.InputJsonValue;
  }) {
    return prisma.aiCopilotContext.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId,
        role: input.role,
        pagePath: input.pagePath ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        contextJson: asInputJson(input.contextJson) ?? {}
      }
    });
  }

  async replaceUserFeedbackMemory(input: {
    userId: string;
    role: string;
    messageId: string;
    factValue: string;
  }) {
    const owner =
      input.role === "CREATOR"
        ? { ownerType: "CREATOR" as const, creatorId: input.userId, brandId: null }
        : input.role === "BRAND"
          ? { ownerType: "BRAND" as const, brandId: input.userId, creatorId: null }
          : null;
    if (!owner) return null;

    const where = {
      ownerType: owner.ownerType,
      brandId: owner.brandId,
      creatorId: owner.creatorId,
      campaignId: null,
      category: "ai_copilot_feedback",
      factKey: `message:${input.messageId}`
    };
    await prisma.memoryFact.deleteMany({ where });
    return prisma.memoryFact.create({
      data: {
        ...where,
        factValue: input.factValue,
        confidence: 1,
        sourceType: "ai_copilot_feedback",
        sourceRefId: input.messageId
      }
    });
  }

  listActiveKnowledgeQa(languageCode: string, scope: LucienKnowledgeRetrievalScope, limit = 300) {
    const filter = LUCIEN_KNOWLEDGE_SCOPE_FILTERS[scope];
    return prisma.aiKnowledgeQa.findMany({
      where: {
        languageCode,
        status: "ACTIVE",
        knowledgeType: { in: filter.knowledgeTypes },
        visibility: { in: [...filter.visibilities] },
        sourceType: { in: [...filter.allowedSourceTypes] }
      },
      orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        sourceKey: true,
        languageCode: true,
        module: true,
        question: true,
        answer: true,
        searchText: true,
        usageCount: true,
        knowledgeType: true,
        visibility: true,
        sourceType: true
      }
    });
  }

  markKnowledgeQaUsed(ids: string[]) {
    if (ids.length === 0) return Promise.resolve({ count: 0 });
    return prisma.aiKnowledgeQa.updateMany({
      where: { id: { in: ids } },
      data: { usageCount: { increment: 1 } }
    });
  }

  createLearning(input: {
    sourceEventId: string;
    entityType: string;
    entityId: string;
    learningType: string;
    before?: Prisma.InputJsonValue | null;
    after: Prisma.InputJsonValue;
    confidence: number;
  }) {
    return prisma.aILearning.create({
      data: {
        sourceEventId: input.sourceEventId,
        entityType: input.entityType,
        entityId: input.entityId,
        learningType: input.learningType,
        before: input.before == null ? undefined : asInputJson(input.before),
        after: asInputJson(input.after) ?? {},
        confidence: input.confidence
      }
    });
  }

  recordKnowledgeQaFeedback(ids: string[], rating: "HELPFUL" | "NOT_HELPFUL") {
    if (ids.length === 0) return Promise.resolve({ count: 0 });
    return prisma.aiKnowledgeQa.updateMany({
      where: { id: { in: ids } },
      data:
        rating === "HELPFUL"
          ? { helpfulCount: { increment: 1 } }
          : { notHelpfulCount: { increment: 1 } }
    });
  }
}

export const aiCopilotRepository = new AiCopilotRepository();
