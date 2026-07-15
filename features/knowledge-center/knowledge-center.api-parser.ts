import type { KnowledgeArticleStatus, KnowledgeLucienCategory, KnowledgeLucienPriority, KnowledgeSchemaOrgType } from "@prisma/client";
import { appError } from "@/lib/core/errors";
import type { UpsertKnowledgeArticleInput } from "@/features/knowledge-center/knowledge-center.types";
import { KNOWLEDGE_VISIBILITY_OPTIONS } from "@/lib/knowledge/knowledge-editor.constants";
import type { KnowledgeVisibility } from "@/lib/knowledge/knowledge-editor-validation";
import { rewriteKnowledgeAssetUrl } from "@/lib/knowledge/knowledge-asset-urls";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function parseVisibility(value: unknown): KnowledgeVisibility {
  const normalized = asString(value).toUpperCase();
  if ((KNOWLEDGE_VISIBILITY_OPTIONS as readonly string[]).includes(normalized)) {
    return normalized as KnowledgeVisibility;
  }
  return "PUBLIC";
}

export function parseKnowledgeArticleBody(body: Record<string, unknown>): UpsertKnowledgeArticleInput {
  const title = asString(body.title);
  if (!title) throw appError("VALIDATION_ERROR", "title is required");

  const translationRaw = (body.translation ?? body) as Record<string, unknown>;
  const languageCode = asString(translationRaw.language_code) || "en";
  const bodyHtml = asString(translationRaw.body_html);
  const bodyMarkdown = asString(translationRaw.body_markdown);
  const status = (asString(translationRaw.status).toUpperCase() || asString(body.status).toUpperCase() || "DRAFT") as KnowledgeArticleStatus;
  const hasBody = Boolean(bodyHtml || bodyMarkdown);
  if (!hasBody && status === "PUBLISHED") throw appError("VALIDATION_ERROR", "body_html is required");

  const seoRaw = (translationRaw.seo ?? {}) as Record<string, unknown>;
  const lucienRaw = (translationRaw.lucien ?? {}) as Record<string, unknown>;
  const faqsRaw = Array.isArray(translationRaw.faqs) ? translationRaw.faqs : [];

  return {
    slug: asString(body.slug) || undefined,
    title,
    category_slug: asString(body.category_slug) || undefined,
    category_id: asString(body.category_id) || undefined,
    author_name: asString(body.author_name) || "VINCIS",
    cover_image_url: rewriteKnowledgeAssetUrl(asString(body.cover_image_url)) || undefined,
    visibility: parseVisibility(body.visibility),
    status: (asString(body.status).toUpperCase() || "DRAFT") as KnowledgeArticleStatus,
    tags: asStringArray(body.tags),
    scheduled_at: asString(body.scheduled_at) || null,
    timezone: asString(body.timezone) || "UTC",
    translation: {
      language_code: languageCode,
      title: asString(translationRaw.title) || title,
      subtitle: asString(translationRaw.subtitle) || undefined,
      body_html: bodyHtml,
      body_markdown: bodyMarkdown,
      excerpt: asString(translationRaw.excerpt) || undefined,
      status: (asString(translationRaw.status).toUpperCase() || asString(body.status).toUpperCase() || "DRAFT") as KnowledgeArticleStatus,
      schema_type: (asString(translationRaw.schema_type).toUpperCase() || "ARTICLE") as KnowledgeSchemaOrgType,
      seo: {
        seo_title: asString(seoRaw.seo_title) || undefined,
        meta_description: asString(seoRaw.meta_description) || undefined,
        canonical_url: asString(seoRaw.canonical_url) || undefined,
        keywords: asStringArray(seoRaw.keywords),
        og_title: asString(seoRaw.og_title) || undefined,
        og_description: asString(seoRaw.og_description) || undefined,
            og_image_url: rewriteKnowledgeAssetUrl(asString(seoRaw.og_image_url)) || undefined,
        twitter_card: asString(seoRaw.twitter_card) || undefined
      },
      faqs: faqsRaw
        .map((item, index) => {
          const row = item as Record<string, unknown>;
          return {
            question: asString(row.question),
            answer: asString(row.answer),
            sort_order: typeof row.sort_order === "number" ? row.sort_order : index
          };
        })
        .filter((item) => item.question && item.answer),
      lucien: {
        ai_summary: asString(lucienRaw.ai_summary) || undefined,
        ai_keywords: asStringArray(lucienRaw.ai_keywords),
        ai_topics: asStringArray(lucienRaw.ai_topics),
        ai_intent: asString(lucienRaw.ai_intent) || "informational",
        ai_confidence: Number(lucienRaw.ai_confidence ?? 80),
        llm_friendly: lucienRaw.llm_friendly !== false,
        allow_citation: lucienRaw.allow_citation !== false,
        allow_training: lucienRaw.allow_training === true,
        lucien_learning: lucienRaw.lucien_learning !== false,
        search_priority: Number(lucienRaw.search_priority ?? 50),
        category: (asString(lucienRaw.category).toUpperCase() || "WORKFLOW") as KnowledgeLucienCategory,
        weight: Number(lucienRaw.weight ?? 100),
        priority: (asString(lucienRaw.priority).toUpperCase() || "MEDIUM") as KnowledgeLucienPriority
      }
    }
  };
}
