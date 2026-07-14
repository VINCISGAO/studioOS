import type {
  KnowledgeArticle,
  KnowledgeCategory,
  KnowledgeFaq,
  KnowledgeLucien,
  KnowledgeSeo,
  KnowledgeTag,
  KnowledgeTranslation
} from "@prisma/client";
import { KNOWLEDGE_DEFAULT_CATEGORIES, knowledgePathPrefixForCode } from "@/features/knowledge-center/knowledge-center.constants";
import { KNOWLEDGE_EDITOR_CATEGORIES } from "@/lib/knowledge/knowledge-editor.constants";
import type {
  KnowledgeArticleDetailDto,
  KnowledgeArticleListItemDto,
  KnowledgeFaqDto,
  KnowledgeLucienDto,
  KnowledgeSeoDto,
  KnowledgeTranslationDto
} from "@/features/knowledge-center/knowledge-center.types";

type TranslationWithRelations = KnowledgeTranslation & {
  seo: KnowledgeSeo | null;
  faqs: KnowledgeFaq[];
  lucien: KnowledgeLucien | null;
  schema: { schemaType: KnowledgeTranslationDto["schema_type"] } | null;
};

type ArticleWithRelations = KnowledgeArticle & {
  category: KnowledgeCategory | null;
  tags: Array<{ tag: KnowledgeTag }>;
  translations: TranslationWithRelations[];
  analytics: {
    viewCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
    monthlyViews: number;
  } | null;
};

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

export function toSeoDto(row: KnowledgeSeo | null): KnowledgeSeoDto | null {
  if (!row) return null;
  return {
    seo_title: row.seoTitle,
    meta_description: row.metaDescription,
    canonical_url: row.canonicalUrl,
    keywords: stringList(row.keywordsJson),
    og_title: row.ogTitle,
    og_description: row.ogDescription,
    og_image_url: row.ogImageUrl,
    twitter_card: row.twitterCard,
    seo_score: row.seoScore,
    readability_score: row.readabilityScore,
    ai_friendly_score: row.aiFriendlyScore,
    google_score: row.googleScore,
    baidu_score: row.baiduScore,
    internal_link_count: row.internalLinkCount,
    external_link_count: row.externalLinkCount
  };
}

export function toFaqDto(row: KnowledgeFaq): KnowledgeFaqDto {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    sort_order: row.sortOrder
  };
}

export function toLucienDto(row: KnowledgeLucien | null): KnowledgeLucienDto | null {
  if (!row) return null;
  return {
    ai_summary: row.aiSummary,
    ai_keywords: stringList(row.aiKeywordsJson),
    ai_topics: stringList(row.aiTopicsJson),
    ai_intent: row.aiIntent,
    ai_confidence: row.aiConfidence,
    llm_friendly: row.llmFriendly,
    allow_citation: row.allowCitation,
    allow_training: row.allowTraining,
    lucien_learning: row.lucienLearning,
    search_priority: row.searchPriority,
    category: row.category,
    weight: row.weight,
    priority: row.priority,
    lucien_indexed: row.lucienIndexed,
    lucien_synced_at: row.lucienSyncedAt?.toISOString() ?? null
  };
}

export function toTranslationDto(row: TranslationWithRelations): KnowledgeTranslationDto {
  return {
    id: row.id,
    language_code: row.languageCode,
    path_prefix: knowledgePathPrefixForCode(row.languageCode),
    title: row.title,
    subtitle: row.subtitle,
    body_markdown: row.bodyMarkdown,
    excerpt: row.excerpt,
    reading_time_minutes: row.readingTimeMinutes,
    status: row.status,
    published_at: row.publishedAt?.toISOString() ?? null,
    updated_at: row.updatedAt.toISOString(),
    seo: toSeoDto(row.seo),
    faqs: row.faqs.map(toFaqDto).sort((a, b) => a.sort_order - b.sort_order),
    lucien: toLucienDto(row.lucien),
    schema_type: row.schema?.schemaType ?? "ARTICLE"
  };
}

export function toArticleDetailDto(row: ArticleWithRelations): KnowledgeArticleDetailDto {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    author_name: row.authorName,
    category_id: row.categoryId,
    category_slug: row.category?.slug ?? null,
    category_name: row.category?.name ?? null,
    cover_image_url: row.coverImageUrl,
    tags: row.tags.map((item) => item.tag.name),
    scheduled_at: row.scheduledAt?.toISOString() ?? null,
    timezone: row.timezone,
    published_at: row.publishedAt?.toISOString() ?? null,
    translations: row.translations.map(toTranslationDto),
    analytics: {
      view_count: row.analytics?.viewCount ?? 0,
      helpful_count: row.analytics?.helpfulCount ?? 0,
      not_helpful_count: row.analytics?.notHelpfulCount ?? 0,
      monthly_views: row.analytics?.monthlyViews ?? 0
    }
  };
}

export function toArticleListItemDto(row: ArticleWithRelations, languageCode?: string): KnowledgeArticleListItemDto {
  const translation =
    row.translations.find((item) => item.languageCode === languageCode) ?? row.translations[0] ?? null;
  return {
    id: row.id,
    slug: row.slug,
    title: translation?.title ?? row.slug,
    category: row.category?.name ?? "",
    status: translation?.status ?? row.status,
    language_code: translation?.languageCode ?? "en",
    author_name: row.authorName,
    updated_at: (translation?.updatedAt ?? row.updatedAt).toISOString(),
    seo_score: translation?.seo?.seoScore ?? 0,
    lucien_indexed: translation?.lucien?.lucienIndexed ?? false,
    view_count: row.analytics?.viewCount ?? 0
  };
}

const defaultCategorySlugs = new Set<string>(KNOWLEDGE_DEFAULT_CATEGORIES.map((item) => item.slug));

export const knowledgeSeedCategories = [
  ...KNOWLEDGE_DEFAULT_CATEGORIES,
  ...KNOWLEDGE_EDITOR_CATEGORIES.filter((item) => !defaultCategorySlugs.has(item.slug))
];
