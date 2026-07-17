import type {
  KnowledgeArticleDetailDto,
  KnowledgeTranslationDto,
  UpsertKnowledgeArticleInput
} from "@/features/knowledge-center/knowledge-center.types";
import { KNOWLEDGE_LANGUAGE_OPTIONS } from "@/features/knowledge-center/knowledge-center.constants";

export function listMissingPublishedLanguageCodes(detail: KnowledgeArticleDetailDto): string[] {
  const published = new Set(
    detail.translations.filter((item) => item.status === "PUBLISHED").map((item) => item.language_code)
  );

  return KNOWLEDGE_LANGUAGE_OPTIONS.map((item) => item.code).filter((code) => !published.has(code));
}

export function pickMultilingualSourceTranslation(
  detail: KnowledgeArticleDetailDto,
  preferredLanguage?: string
): KnowledgeTranslationDto | null {
  const published = detail.translations.filter((item) => item.status === "PUBLISHED");
  if (!published.length) return null;

  if (preferredLanguage) {
    const preferred = published.find((item) => item.language_code === preferredLanguage);
    if (preferred) return preferred;
  }

  const english = published.find((item) => item.language_code === "en");
  if (english) return english;

  const simplifiedChinese = published.find((item) => item.language_code === "zh-CN");
  if (simplifiedChinese) return simplifiedChinese;

  return published[0] ?? null;
}

export function buildPublishUpsertFromDetail(
  detail: KnowledgeArticleDetailDto,
  source: KnowledgeTranslationDto
): UpsertKnowledgeArticleInput {
  return {
    slug: detail.slug,
    title: source.title,
    category_slug: detail.category_slug ?? undefined,
    author_name: detail.author_name,
    cover_image_url: detail.cover_image_url ?? undefined,
    visibility: detail.visibility,
    status: "PUBLISHED",
    tags: detail.tags,
    translation: {
      language_code: source.language_code,
      title: source.title,
      subtitle: source.subtitle ?? undefined,
      body_html: source.body_html,
      body_markdown: source.body_markdown,
      excerpt: source.excerpt ?? undefined,
      status: "PUBLISHED",
      seo: source.seo
        ? {
            seo_title: source.seo.seo_title ?? undefined,
            meta_description: source.seo.meta_description ?? undefined,
            canonical_url: source.seo.canonical_url ?? undefined,
            keywords: source.seo.keywords ?? undefined,
            og_title: source.seo.og_title ?? undefined,
            og_description: source.seo.og_description ?? undefined,
            og_image_url: source.seo.og_image_url ?? undefined,
            twitter_card: source.seo.twitter_card ?? undefined
          }
        : undefined,
      faqs: source.faqs.map((faq, index) => ({
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sort_order ?? index
      })),
      lucien: source.lucien
        ? {
            ai_summary: source.lucien.ai_summary ?? undefined,
            ai_keywords: source.lucien.ai_keywords ?? undefined,
            ai_topics: source.lucien.ai_topics ?? undefined,
            ai_intent: source.lucien.ai_intent ?? undefined,
            ai_confidence: source.lucien.ai_confidence ?? undefined,
            llm_friendly: source.lucien.llm_friendly ?? undefined,
            allow_citation: source.lucien.allow_citation ?? undefined,
            allow_training: source.lucien.allow_training ?? undefined,
            lucien_learning: source.lucien.lucien_learning ?? undefined,
            search_priority: source.lucien.search_priority ?? undefined,
            category: source.lucien.category ?? undefined,
            weight: source.lucien.weight ?? undefined,
            priority: source.lucien.priority ?? undefined
          }
        : undefined,
      schema_type: source.schema_type
    }
  };
}
