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

export const LUCIEN_CHAT_ANSWER_MAX_CHARS = 480;
export const LUCIEN_CHAT_CONTEXT_EXCERPT_MAX_CHARS = 360;

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

export function trimLucienChatAnswer(answer: string, maxChars = LUCIEN_CHAT_ANSWER_MAX_CHARS) {
  const trimmed = answer.trim();
  if (!trimmed || trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const lastBreak = Math.max(slice.lastIndexOf("。"), slice.lastIndexOf("！"), slice.lastIndexOf("？"), slice.lastIndexOf(". "));
  if (lastBreak > maxChars * 0.55) {
    return slice.slice(0, lastBreak + 1).trim();
  }
  return `${slice.trim()}…`;
}

export function buildLucienKnowledgeContextForModel(matches: KnowledgeQaMatch[], language: string) {
  if (!matches.length) {
    return isZhLanguage(language) ? "无匹配知识片段。" : "No matching knowledge snippets.";
  }

  return matches
    .map((match, index) => {
      const excerpt = trimLucienChatAnswer(match.answer, LUCIEN_CHAT_CONTEXT_EXCERPT_MAX_CHARS);
      return `Snippet ${index + 1}:\nTopic: ${match.question}\nExcerpt: ${excerpt}`;
    })
    .join("\n\n");
}

export function buildPublicLucienKnowledgeUserPrompt(message: string, matches: KnowledgeQaMatch[], language: string) {
  const zh = isZhLanguage(language);
  const context = buildLucienKnowledgeContextForModel(matches, language);

  if (zh) {
    return [
      `用户问题：\n${message}`,
      "",
      "参考知识片段（仅供提炼，禁止整段复制）：",
      context,
      "",
      "请用 2–4 段或少量 bullet 直接回答用户问题。",
      "要求：总结提炼关键信息；不要输出文章全文；不要重复用户问题作标题；语气像业务助手对话；必要时可引导用户阅读知识中心完整文章。"
    ].join("\n");
  }

  return [
    `User question:\n${message}`,
    "",
    "Reference snippets (for synthesis only — do not copy verbatim):",
    context,
    "",
    "Reply in 2–4 short paragraphs or a few bullets.",
    "Summarize key points; never paste the full article; do not repeat the question as a heading; sound like a helpful business assistant."
  ].join("\n");
}

export function answerFromKnowledge(matches: KnowledgeQaMatch[]) {
  const top = matches[0];
  if (!top?.answer.trim()) return null;
  return trimLucienChatAnswer(top.answer);
}
