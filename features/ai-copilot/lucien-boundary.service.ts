import { lucienAuditService, type LucienAuditInput } from "@/features/ai-copilot/lucien-audit.service";
import {
  lucienBoundarySystemRules,
  lucienRefusalMessageForCategory,
  type LucienQueryBlockCategory
} from "@/features/ai-copilot/lucien-knowledge-boundary.constants";
import { lucienQueryGuardService } from "@/features/ai-copilot/lucien-query-guard.service";
import type { LucienKnowledgeRetrievalScope } from "@/features/ai-copilot/lucien-knowledge-scope";
import { recordLucienInteraction } from "@/features/ai-copilot/lucien-learning.service";
import { logger } from "@/lib/core/logger";

/** One boundary rule set for public marketing Lucien and authenticated workspace Lucien. */
export type LucienBoundaryBlocked = {
  blocked: true;
  category: LucienQueryBlockCategory;
  refusalMessage: string;
  answerMode: "boundary_refusal";
};

export type LucienBoundaryAllowed = {
  blocked: false;
};

export type LucienBoundaryResult = LucienBoundaryBlocked | LucienBoundaryAllowed;

export function evaluateLucienBoundary(message: string, language: string): LucienBoundaryResult {
  const assessment = lucienQueryGuardService.assess(message, language);
  if (!assessment.blocked || !assessment.category) {
    return { blocked: false };
  }

  return {
    blocked: true,
    category: assessment.category,
    refusalMessage:
      assessment.refusalMessage ?? lucienRefusalMessageForCategory(assessment.category, language),
    answerMode: "boundary_refusal"
  };
}

export function lucienSharedSystemRules(language: string): string {
  return lucienBoundarySystemRules(language);
}

export type LucienBoundaryRefusalAuditInput = {
  surface: LucienAuditInput["surface"];
  category: LucienQueryBlockCategory;
  knowledgeScope: LucienKnowledgeRetrievalScope;
  userMessage: string;
  language: string;
  refusalMessage: string;
  userId?: string | null;
  role?: string | null;
  guestSessionId?: string | null;
  pagePath?: string | null;
};

export async function recordLucienBoundaryRefusal(input: LucienBoundaryRefusalAuditInput) {
  const entityId = input.userId ?? input.guestSessionId ?? "anonymous";

  try {
    await lucienAuditService.record({
      surface: input.surface,
      userId: input.userId,
      role: input.role,
      guestSessionId: input.guestSessionId,
      pagePath: input.pagePath,
      queryCategory: input.category,
      authorizationResult: "denied",
      knowledgeScope: input.knowledgeScope,
      answerMode: "boundary_refusal"
    });
  } catch (error) {
    logger.error("Lucien boundary audit failed", {
      service: "LucienBoundaryService",
      surface: input.surface,
      category: input.category,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  await recordLucienInteraction({
    surface: input.surface,
    entityId,
    role: input.role,
    pagePath: input.pagePath,
    language: input.language,
    userMessage: input.userMessage,
    assistantAnswer: input.refusalMessage,
    answerMode: "boundary_refusal",
    knowledgeScope: input.knowledgeScope,
    queryCategory: input.category,
    blockCategory: input.category
  });
}
