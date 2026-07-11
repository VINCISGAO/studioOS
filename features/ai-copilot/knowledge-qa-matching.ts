import { buildMarketingFaqKnowledgeRows } from "@/features/ai-copilot/marketing-faq-knowledge.mapper";
import { aiCopilotRepository } from "@/features/ai-copilot/ai-copilot.repository";
import type { LucienKnowledgeRetrievalScope } from "@/features/ai-copilot/lucien-knowledge-scope";
import { logger } from "@/lib/core/logger";

type KnowledgeScoreCandidate = {
  question: string;
  searchText: string;
  usageCount?: number;
};

export type KnowledgeQaMatch = {
  id: string;
  sourceKey: string | null;
  module: string | null;
  question: string;
  answer: string;
  score: number;
};

function isZhLanguage(language: string) {
  return language === "zh-CN" || language === "zh-TW" || language === "zh";
}

function knowledgeLanguageCode(language: string) {
  return isZhLanguage(language) ? "zh-CN" : language;
}

function compactSearchText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function wordTerms(value: string) {
  return value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}

function charNgrams(value: string) {
  const chars = Array.from(value);
  if (chars.length < 2 || chars.length > 80) return [];
  const grams: string[] = [];
  for (let index = 0; index < chars.length - 1; index += 1) {
    grams.push(`${chars[index]}${chars[index + 1]}`);
  }
  return grams;
}

export function knowledgeScore(message: string, candidate: KnowledgeScoreCandidate) {
  const query = compactSearchText(message);
  const question = compactSearchText(candidate.question);
  const searchText = compactSearchText(candidate.searchText);
  if (!query) return 0;

  let score = 0;
  if (question === query) score += 200;
  if (question.includes(query) || query.includes(question)) score += 120;

  const terms = Array.from(new Set([...wordTerms(message), ...charNgrams(query)]));
  for (const term of terms) {
    if (question.includes(term)) score += 6;
    else if (searchText.includes(term)) score += 2;
  }
  return score;
}

function rankKnowledgeCandidates<T extends KnowledgeScoreCandidate & { id: string; sourceKey?: string | null; module?: string | null; answer: string }>(
  message: string,
  candidates: T[]
): Array<T & { score: number }> {
  return candidates
    .map((candidate) => ({ ...candidate, score: knowledgeScore(message, candidate) }))
    .filter((candidate) => candidate.score >= 12)
    .sort((a, b) => b.score - a.score || (b.usageCount ?? 0) - (a.usageCount ?? 0))
    .slice(0, 3);
}

function toKnowledgeMatches<T extends { id: string; sourceKey?: string | null; module?: string | null; question: string; answer: string; score: number }>(
  candidates: T[]
): KnowledgeQaMatch[] {
  return candidates.map((candidate) => ({
    id: candidate.id,
    sourceKey: candidate.sourceKey ?? null,
    module: candidate.module ?? null,
    question: candidate.question,
    answer: candidate.answer,
    score: candidate.score
  }));
}

async function findDatabaseKnowledgeMatches(
  message: string,
  language: string,
  scope: LucienKnowledgeRetrievalScope
): Promise<KnowledgeQaMatch[]> {
  if (!aiCopilotRepository.isEnabled()) return [];

  try {
    const candidates = await aiCopilotRepository.listActiveKnowledgeQa(knowledgeLanguageCode(language), scope);
    return toKnowledgeMatches(rankKnowledgeCandidates(message, candidates));
  } catch (error) {
    logger.warn("Knowledge QA database lookup failed", {
      service: "KnowledgeQaMatching",
      scope,
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}

function findInMemoryMarketingFaqMatches(message: string, language: string): KnowledgeQaMatch[] {
  const languageCode = knowledgeLanguageCode(language);
  const candidates = buildMarketingFaqKnowledgeRows()
    .filter((row) => row.languageCode === languageCode)
    .map((row) => ({
      id: row.sourceKey,
      sourceKey: row.sourceKey,
      module: row.module,
      question: row.question,
      answer: row.answer,
      searchText: row.searchText,
      usageCount: 0
    }));

  return toKnowledgeMatches(rankKnowledgeCandidates(message, candidates));
}

export async function findKnowledgeMatches(
  message: string,
  language: string,
  scope: LucienKnowledgeRetrievalScope = "authenticated_business"
): Promise<KnowledgeQaMatch[]> {
  const databaseMatches = await findDatabaseKnowledgeMatches(message, language, scope);
  if (databaseMatches.length > 0) return databaseMatches;

  if (scope === "public_marketing") {
    return findInMemoryMarketingFaqMatches(message, language);
  }

  return [];
}

export function isPersistableKnowledgeMatch(match: KnowledgeQaMatch) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(match.id);
}

export function answerFromKnowledge(matches: KnowledgeQaMatch[]) {
  return matches[0]?.answer ?? null;
}
