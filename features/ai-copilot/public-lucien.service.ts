import { randomUUID } from "crypto";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { aiCopilotRepository } from "@/features/ai-copilot/ai-copilot.repository";
import {
  answerFromKnowledge,
  findKnowledgeMatches,
  isPersistableKnowledgeMatch,
  type KnowledgeQaMatch
} from "@/features/ai-copilot/knowledge-qa-matching";
import { lucienAuditService, type LucienAuditInput } from "@/features/ai-copilot/lucien-audit.service";
import {
  evaluateLucienBoundary,
  lucienSharedSystemRules,
  recordLucienBoundaryRefusal
} from "@/features/ai-copilot/lucien-boundary.service";
import { recordLucienInteraction } from "@/features/ai-copilot/lucien-learning.service";
import { publicLucienSuggestions } from "@/lib/marketing/faq-copy";
import { isPublicLucienPagePath, normalizePublicLucienPagePath } from "@/lib/marketing/public-lucien-paths";
import { appError } from "@/lib/core/errors";
import { logger } from "@/lib/core/logger";
import { resolveOpenAIModel } from "@/lib/core/config/ai";
import type { Locale } from "@/lib/i18n";

const KNOWLEDGE_DIRECT_THRESHOLD = 30;
const PUBLIC_KNOWLEDGE_SCOPE = "public_marketing" as const;

export type PublicLucienRequest = {
  message: string;
  languageCode?: string | null;
  guestSessionId?: string | null;
  pagePath?: string | null;
};

export type PublicLucienAnswer = {
  answer: string;
  suggestedQuestions: string[];
  answerMode: "knowledge_base" | "model" | "fallback" | "boundary_refusal";
};

function resolveLanguage(languageCode?: string | null): string {
  const raw = languageCode?.trim() || "en";
  if (raw === "zh" || raw.startsWith("zh-")) return "zh-CN";
  return raw;
}

function resolveLocale(language: string): Locale {
  return language === "zh-CN" || language === "zh-TW" || language === "zh" ? "zh" : "en";
}

function buildPublicSystemPrompt(language: string) {
  return lucienSharedSystemRules(language);
}

function buildKnowledgeContext(matches: KnowledgeQaMatch[]) {
  if (matches.length === 0) return "No approved public FAQ matches.";
  return matches
    .map((match, index) => `FAQ ${index + 1}:\nQ: ${match.question}\nA: ${match.answer}`)
    .join("\n\n");
}

function fallbackAnswer(language: string) {
  const zh = language === "zh-CN" || language === "zh-TW" || language === "zh";
  return zh
    ? "我还不能确定这个问题的准确答案。你可以浏览上方 FAQ，或登录后使用完整版卢西恩助手获取更具体的帮助。"
    : "I'm not sure about that yet. Browse the FAQ above, or sign in for the full Lucien assistant.";
}

function coerceGuestSessionId(value?: string | null) {
  const trimmed = value?.trim();
  if (
    trimmed &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)
  ) {
    return trimmed;
  }
  return randomUUID();
}

async function safeAudit(input: LucienAuditInput) {
  try {
    await lucienAuditService.record(input);
  } catch (error) {
    logger.error("Public Lucien audit failed", {
      service: "PublicLucienService",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function recordKnowledgeLearning(
  message: string,
  language: string,
  matches: KnowledgeQaMatch[],
  guestSessionId: string
) {
  if (!aiCopilotRepository.isEnabled()) return;

  const persistableMatches = matches.filter(isPersistableKnowledgeMatch);
  if (persistableMatches.length === 0) return;

  const sourceEventId = randomUUID();
  await Promise.all([
    aiCopilotRepository.markKnowledgeQaUsed(persistableMatches.map((item) => item.id)),
    aiCopilotRepository.createLearning({
      sourceEventId,
      entityType: "public_lucien",
      entityId: guestSessionId,
      learningType: "public_lucien_qa_retrieval",
      after: {
        message: message.trim(),
        language,
        knowledgeScope: PUBLIC_KNOWLEDGE_SCOPE,
        matches: persistableMatches.map((item) => ({
          id: item.id,
          sourceKey: item.sourceKey,
          question: item.question,
          score: item.score
        }))
      },
      confidence: Math.min(1, (persistableMatches[0]?.score ?? 0) / 120)
    })
  ]);
}

async function safeRecordKnowledgeLearning(
  message: string,
  language: string,
  matches: KnowledgeQaMatch[],
  guestSessionId: string
) {
  try {
    await recordKnowledgeLearning(message, language, matches, guestSessionId);
  } catch (error) {
    logger.error("Public Lucien knowledge learning failed", {
      service: "PublicLucienService",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function safeRecordPublicInteraction(input: {
  guestSessionId: string;
  pagePath: string;
  language: string;
  userMessage: string;
  assistantAnswer: string;
  answerMode: PublicLucienAnswer["answerMode"];
  matches?: KnowledgeQaMatch[];
}) {
  try {
    await recordLucienInteraction({
      surface: "public",
      entityId: input.guestSessionId,
      pagePath: input.pagePath,
      language: input.language,
      userMessage: input.userMessage,
      assistantAnswer: input.assistantAnswer,
      answerMode: input.answerMode,
      knowledgeScope: PUBLIC_KNOWLEDGE_SCOPE,
      knowledgeMatches: input.matches?.map((match) => ({
        id: match.id,
        sourceKey: match.sourceKey,
        question: match.question,
        score: match.score
      }))
    });
  } catch (error) {
    logger.error("Public Lucien interaction learning failed", {
      service: "PublicLucienService",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export class PublicLucienService {
  async answer(input: PublicLucienRequest): Promise<PublicLucienAnswer> {
    const pagePath = normalizePublicLucienPagePath(input.pagePath);
    if (!isPublicLucienPagePath(pagePath)) {
      throw appError("FORBIDDEN", "Public Lucien is only available on marketing docs pages");
    }

    const message = input.message.trim();
    const language = resolveLanguage(input.languageCode);
    const locale = resolveLocale(language);
    const guestSessionId = coerceGuestSessionId(input.guestSessionId);
    const suggestedQuestions = publicLucienSuggestions(locale);

    const boundary = evaluateLucienBoundary(message, language);
    if (boundary.blocked) {
      await recordLucienBoundaryRefusal({
        surface: "public",
        category: boundary.category,
        knowledgeScope: PUBLIC_KNOWLEDGE_SCOPE,
        guestSessionId,
        pagePath,
        userMessage: message,
        language,
        refusalMessage: boundary.refusalMessage
      });
      return {
        answer: boundary.refusalMessage,
        suggestedQuestions,
        answerMode: boundary.answerMode
      };
    }

    const matches = await findKnowledgeMatches(message, language, PUBLIC_KNOWLEDGE_SCOPE);
    const knowledgeAnswer = answerFromKnowledge(matches);
    const topScore = matches[0]?.score ?? 0;

    if (knowledgeAnswer && topScore >= KNOWLEDGE_DIRECT_THRESHOLD) {
      await safeRecordKnowledgeLearning(message, language, matches, guestSessionId);
      await safeAudit({
        surface: "public",
        guestSessionId,
        pagePath,
        queryCategory: "business",
        authorizationResult: "allowed",
        knowledgeScope: PUBLIC_KNOWLEDGE_SCOPE,
        dataCategories: ["faq"],
        answerMode: "knowledge_base"
      });
      await safeRecordPublicInteraction({
        guestSessionId,
        pagePath,
        language,
        userMessage: message,
        assistantAnswer: knowledgeAnswer,
        answerMode: "knowledge_base",
        matches
      });
      return {
        answer: knowledgeAnswer,
        suggestedQuestions,
        answerMode: "knowledge_base"
      };
    }

    if (aiGatewayService.isConfigured()) {
      try {
        const result = await aiGatewayService.chatCompletion({
          system: buildPublicSystemPrompt(language),
          user: `User question:\n${message}\n\nApproved public FAQ knowledge:\n${buildKnowledgeContext(matches)}`,
          model: resolveOpenAIModel(),
          temperature: 0.2,
          language
        });
        if (result.content) {
          if (matches.length > 0) {
            await safeRecordKnowledgeLearning(message, language, matches, guestSessionId);
          }
          await safeAudit({
            surface: "public",
            guestSessionId,
            pagePath,
            queryCategory: "business",
            authorizationResult: "allowed",
            knowledgeScope: PUBLIC_KNOWLEDGE_SCOPE,
            dataCategories: ["faq"],
            answerMode: "model"
          });
          await safeRecordPublicInteraction({
            guestSessionId,
            pagePath,
            language,
            userMessage: message,
            assistantAnswer: result.content,
            answerMode: "model",
            matches
          });
          return {
            answer: result.content,
            suggestedQuestions,
            answerMode: "model"
          };
        }
      } catch (error) {
        logger.error("Public Lucien model request failed", {
          service: "PublicLucienService",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (knowledgeAnswer) {
      await safeRecordKnowledgeLearning(message, language, matches, guestSessionId);
      await safeAudit({
        surface: "public",
        guestSessionId,
        pagePath,
        queryCategory: "business",
        authorizationResult: "allowed",
        knowledgeScope: PUBLIC_KNOWLEDGE_SCOPE,
        dataCategories: ["faq"],
        answerMode: "knowledge_base"
      });
      await safeRecordPublicInteraction({
        guestSessionId,
        pagePath,
        language,
        userMessage: message,
        assistantAnswer: knowledgeAnswer,
        answerMode: "knowledge_base",
        matches
      });
      return {
        answer: knowledgeAnswer,
        suggestedQuestions,
        answerMode: "knowledge_base"
      };
    }

    await safeAudit({
      surface: "public",
      guestSessionId,
      pagePath,
      queryCategory: "business",
      authorizationResult: "allowed",
      knowledgeScope: PUBLIC_KNOWLEDGE_SCOPE,
      answerMode: "fallback"
    });

    const fallback = fallbackAnswer(language);
    await safeRecordPublicInteraction({
      guestSessionId,
      pagePath,
      language,
      userMessage: message,
      assistantAnswer: fallback,
      answerMode: "fallback",
      matches
    });

    return {
      answer: fallback,
      suggestedQuestions,
      answerMode: "fallback"
    };
  }
}

export const publicLucienService = new PublicLucienService();
