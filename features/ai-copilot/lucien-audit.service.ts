import { randomUUID } from "crypto";
import { aiCopilotRepository } from "@/features/ai-copilot/ai-copilot.repository";
import type { LucienQueryBlockCategory } from "@/features/ai-copilot/lucien-knowledge-boundary.constants";
import type { LucienKnowledgeRetrievalScope } from "@/features/ai-copilot/lucien-knowledge-scope";

export type LucienAuditSurface = "public" | "authenticated";

export type LucienAuditInput = {
  surface: LucienAuditSurface;
  userId?: string | null;
  role?: string | null;
  guestSessionId?: string | null;
  pagePath?: string | null;
  queryCategory: "business" | LucienQueryBlockCategory;
  authorizationResult: "allowed" | "denied";
  knowledgeScope?: LucienKnowledgeRetrievalScope;
  dataCategories?: string[];
  answerMode?: string;
};

export class LucienAuditService {
  async record(input: LucienAuditInput) {
    if (!aiCopilotRepository.isEnabled()) return;

    const entityId = input.userId ?? input.guestSessionId ?? "anonymous";
    await aiCopilotRepository.createLearning({
      sourceEventId: randomUUID(),
      entityType: "lucien_access_audit",
      entityId,
      learningType: "lucien_knowledge_boundary_audit",
      after: {
        surface: input.surface,
        role: input.role ?? null,
        pagePath: input.pagePath ?? null,
        queryCategory: input.queryCategory,
        authorizationResult: input.authorizationResult,
        knowledgeScope: input.knowledgeScope ?? null,
        dataCategories: input.dataCategories ?? [],
        answerMode: input.answerMode ?? null
      },
      confidence: input.authorizationResult === "denied" ? 1 : 0.8
    });
  }
}

export const lucienAuditService = new LucienAuditService();
