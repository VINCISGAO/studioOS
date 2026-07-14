import "server-only";

import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import { KNOWLEDGE_LANGUAGE_OPTIONS } from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeTranslationInput } from "@/features/knowledge-center/knowledge-center.types";
import type {
  KnowledgeMultilingualSourceBundle,
  KnowledgeTranslatedLocalePayload
} from "@/features/knowledge-center/knowledge-multilingual.types";
import { logger } from "@/lib/core/logger";

function parseJsonObject<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

function languageLabel(code: string) {
  return KNOWLEDGE_LANGUAGE_OPTIONS.find((item) => item.code === code)?.label ?? code;
}

function buildTranslationPrompt(
  source: KnowledgeMultilingualSourceBundle,
  target: (typeof KNOWLEDGE_LANGUAGE_OPTIONS)[number]
) {
  return [
    `Translate this VINCIS Knowledge Center article from ${languageLabel(source.language_code)} to ${target.label} (${target.code}).`,
    'Return JSON only: {"title":"...","subtitle":"...","body_markdown":"...","excerpt":"...","seo_title":"...","meta_description":"...","keywords":["..."],"faqs":[{"question":"...","answer":"..."}]}',
    "Preserve markdown headings, lists, tables, links, and code fences. Do not change URLs or slugs.",
    "",
    `SOURCE TITLE: ${source.title}`,
    source.subtitle ? `SOURCE SUBTITLE: ${source.subtitle}` : null,
    source.seo?.seo_title ? `SOURCE SEO TITLE: ${source.seo.seo_title}` : null,
    source.seo?.meta_description ? `SOURCE META DESCRIPTION: ${source.seo.meta_description}` : null,
    source.seo?.keywords?.length ? `SOURCE KEYWORDS: ${source.seo.keywords.join(", ")}` : null,
    "",
    "SOURCE BODY MARKDOWN:",
    source.body_markdown,
    "",
    source.faqs?.length ? `SOURCE FAQS: ${JSON.stringify(source.faqs)}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

export async function translateKnowledgeArticleLocale(
  source: KnowledgeMultilingualSourceBundle,
  targetLanguageCode: string
): Promise<KnowledgeTranslationInput | null> {
  const target = KNOWLEDGE_LANGUAGE_OPTIONS.find((item) => item.code === targetLanguageCode);
  if (!target) return null;

  const completion = await aiGatewayService.chatCompletion({
    system:
      "You are VINCIS Knowledge Center translator. Produce accurate, SEO-friendly knowledge articles. Keep markdown structure intact.",
    user: buildTranslationPrompt(source, target),
    jsonMode: true,
    temperature: 0.2,
    language: target.label
  });

  const parsed = parseJsonObject<KnowledgeTranslatedLocalePayload>(completion.content);
  if (!parsed?.title?.trim() || !parsed.body_markdown?.trim()) {
    logger.warn("knowledge.multilingual_translate_empty", {
      service: "KnowledgeMultilingualTranslateService",
      targetLanguageCode
    });
    return null;
  }

  const metaDescription = parsed.meta_description?.trim() || parsed.excerpt?.trim() || undefined;
  const keywords = (parsed.keywords ?? []).map((item) => item.trim()).filter(Boolean);

  return {
    language_code: targetLanguageCode,
    title: parsed.title.trim(),
    subtitle: parsed.subtitle?.trim() || undefined,
    body_markdown: parsed.body_markdown.trim(),
    excerpt: parsed.excerpt?.trim() || metaDescription,
    status: "PUBLISHED",
    seo: {
      seo_title: parsed.seo_title?.trim() || parsed.title.trim(),
      meta_description: metaDescription,
      keywords,
      og_title: parsed.seo_title?.trim() || parsed.title.trim(),
      og_description: metaDescription,
      og_image_url: source.seo?.og_image_url,
      twitter_card: source.seo?.twitter_card ?? "summary_large_image"
    },
    faqs: (parsed.faqs ?? source.faqs ?? [])
      .filter((item) => item.question?.trim() && item.answer?.trim())
      .map((item, index) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
        sort_order: item.sort_order ?? index
      })),
    lucien: source.lucien
      ? {
          ...source.lucien,
          ai_summary: metaDescription,
          ai_keywords: keywords.length ? keywords : source.lucien.ai_keywords
        }
      : undefined
  };
}
