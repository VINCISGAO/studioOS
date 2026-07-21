import { randomUUID } from "crypto";
import { aiLearningEventRepository } from "@/features/ai/ai-learning-event.repository";
import { aiCopilotRepository } from "@/features/ai-copilot/ai-copilot.repository";
import type { LucienQueryBlockCategory } from "@/features/ai-copilot/lucien-knowledge-boundary.constants";
import type { LucienKnowledgeRetrievalScope } from "@/features/ai-copilot/lucien-knowledge-scope";
import { asInputJson } from "@/lib/core/prisma-json";
import { logger } from "@/lib/core/logger";

export type LucienLearningSurface = "public" | "authenticated";

export type LucienKnowledgeMatchSnapshot = {
  id: string;
  sourceKey: string | null;
  question: string;
  score: number;
};

export type LucienInteractionLearningInput = {
  surface: LucienLearningSurface;
  entityId: string;
  role?: string | null;
  sessionId?: string | null;
  messageId?: string | null;
  pagePath?: string | null;
  language: string;
  userMessage: string;
  assistantAnswer: string;
  answerMode: string;
  knowledgeScope: LucienKnowledgeRetrievalScope;
  queryCategory?: "business" | LucienQueryBlockCategory;
  blockCategory?: LucienQueryBlockCategory | null;
  knowledgeMatches?: LucienKnowledgeMatchSnapshot[];
  toolCalls?: string[];
};

export type LucienFeedbackLearningInput = {
  surface: LucienLearningSurface;
  entityId: string;
  role: string;
  sessionId?: string | null;
  messageId: string;
  language: string;
  rating: "HELPFUL" | "NOT_HELPFUL";
  assistantMessage: string;
  knowledgeQaIds?: string[];
};

function interactionPayload(input: LucienInteractionLearningInput) {
  return {
    surface: input.surface,
    role: input.role ?? null,
    sessionId: input.sessionId ?? null,
    messageId: input.messageId ?? null,
    pagePath: input.pagePath ?? null,
    language: input.language,
    userMessage: input.userMessage.trim(),
    assistantAnswer: input.assistantAnswer.trim(),
    answerMode: input.answerMode,
    knowledgeScope: input.knowledgeScope,
    queryCategory: input.queryCategory ?? "business",
    blockCategory: input.blockCategory ?? null,
    knowledgeMatches: input.knowledgeMatches ?? [],
    toolCalls: input.toolCalls ?? [],
    recordedAt: new Date().toISOString()
  };
}

function interactionConfidence(answerMode: string) {
  if (answerMode === "boundary_refusal") return 1;
  if (answerMode === "knowledge_base") return 0.92;
  if (answerMode === "model") return 0.88;
  if (answerMode === "image_generation" || answerMode === "image_to_image") return 0.9;
  if (answerMode === "image_generation_failed") return 0.95;
  return 0.75;
}

async function persistLearning(input: {
  eventType: string;
  entityType: string;
  entityId: string;
  learningType: string;
  payload: Record<string, unknown>;
  confidence: number;
}) {
  if (!aiCopilotRepository.isEnabled()) return;

  try {
    await aiLearningEventRepository.append({
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
      learningType: input.learningType,
      after: input.payload,
      confidence: input.confidence
    });
    return;
  } catch (error) {
    logger.warn("Lucien learning event append failed, falling back to ai_learning row", {
      service: "LucienLearningService",
      learningType: input.learningType,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  try {
    await aiCopilotRepository.createLearning({
      sourceEventId: randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      learningType: input.learningType,
      after: asInputJson(input.payload) ?? {},
      confidence: input.confidence
    });
  } catch (error) {
    logger.error("Lucien learning persistence failed", {
      service: "LucienLearningService",
      learningType: input.learningType,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function recordLucienInteraction(input: LucienInteractionLearningInput) {
  const payload = interactionPayload(input);
  const entityType = input.surface === "public" ? "public_lucien" : "ai_copilot";

  await persistLearning({
    eventType: "lucien_assistant_interaction",
    entityType,
    entityId: input.entityId,
    learningType: "lucien_assistant_interaction",
    payload,
    confidence: interactionConfidence(input.answerMode)
  });
}

export async function recordLucienFeedback(input: LucienFeedbackLearningInput) {
  const payload = {
    surface: input.surface,
    role: input.role,
    sessionId: input.sessionId ?? null,
    messageId: input.messageId,
    language: input.language,
    rating: input.rating,
    assistantMessage: input.assistantMessage.slice(0, 1200),
    knowledgeQaIds: input.knowledgeQaIds ?? [],
    recordedAt: new Date().toISOString()
  };

  await persistLearning({
    eventType: "lucien_assistant_feedback",
    entityType: "ai_copilot",
    entityId: input.entityId,
    learningType: "lucien_assistant_feedback",
    payload,
    confidence: input.rating === "NOT_HELPFUL" ? 1 : 0.9
  });
}
