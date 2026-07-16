import type {
  KnowledgeArticleStatus,
  KnowledgeLucienCategory,
  KnowledgeLucienPriority,
  KnowledgeSchemaOrgType
} from "@prisma/client";
import type { KnowledgePathPrefix } from "@/features/knowledge-center/knowledge-center.constants";

export type KnowledgeFaqInput = {
  question: string;
  answer: string;
  sort_order?: number;
};

export type KnowledgeSeoInput = {
  seo_title?: string;
  meta_description?: string;
  canonical_url?: string;
  keywords?: string[];
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  twitter_card?: string;
};

export type KnowledgeLucienInput = {
  ai_summary?: string;
  ai_keywords?: string[];
  ai_topics?: string[];
  ai_intent?: string;
  ai_confidence?: number;
  llm_friendly?: boolean;
  allow_citation?: boolean;
  allow_training?: boolean;
  lucien_learning?: boolean;
  search_priority?: number;
  category?: KnowledgeLucienCategory;
  weight?: number;
  priority?: KnowledgeLucienPriority;
};

export type KnowledgeTranslationInput = {
  language_code: string;
  title: string;
  subtitle?: string;
  body_html?: string;
  body_markdown: string;
  excerpt?: string;
  status?: KnowledgeArticleStatus;
  seo?: KnowledgeSeoInput;
  faqs?: KnowledgeFaqInput[];
  lucien?: KnowledgeLucienInput;
  schema_type?: KnowledgeSchemaOrgType;
};

export type UpsertKnowledgeArticleInput = {
  slug?: string;
  title: string;
  category_slug?: string;
  category_id?: string;
  author_name?: string;
  cover_image_url?: string;
  visibility?: string;
  status?: KnowledgeArticleStatus;
  tags?: string[];
  scheduled_at?: string | null;
  timezone?: string;
  translation: KnowledgeTranslationInput;
};

export type KnowledgeArticleListItemDto = {
  id: string;
  slug: string;
  title: string;
  category: string;
  category_slug: string | null;
  status: KnowledgeArticleStatus;
  language_code: string;
  author_name: string;
  updated_at: string;
  seo_score: number;
  lucien_indexed: boolean;
  view_count: number;
  cover_image_url: string | null;
};

export type KnowledgeHomeArticleCardDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category_name: string | null;
  category_slug: string | null;
  cover_image_url: string | null;
  tags: string[];
  reading_time_minutes: number;
  updated_at: string;
  published_at: string | null;
};

export type KnowledgeDashboardStatsDto = {
  articles: number;
  published: number;
  draft: number;
  languages: number;
  lucien_indexed: number;
  google_indexed: number;
  baidu_indexed: number;
  bing_indexed: number;
  avg_seo: number;
  monthly_views: number;
};

export type KnowledgeSeoSurfaceStatus = "ok" | "warn" | "error";

export type KnowledgeSeoDashboardDto = {
  surfaces: {
    sitemap: { status: KnowledgeSeoSurfaceStatus; url: string; entries: number };
    robots: { status: KnowledgeSeoSurfaceStatus; url: string };
    llms: { status: KnowledgeSeoSurfaceStatus; url: string; entries: number };
    schema: { status: KnowledgeSeoSurfaceStatus; covered: number; total: number };
  };
  indexes: {
    google: number;
    baidu: number;
    bing: number;
  };
  articles: KnowledgeSeoArticleRowDto[];
  published_translations: number;
  site_search_indexed?: number;
  note: string;
};

export type KnowledgeSeoArticleRowDto = {
  id: string;
  slug: string;
  title: string;
  language_code: string;
  status: KnowledgeArticleStatus;
  seo_score: number;
  ai_friendly_score: number;
  google_score: number;
  baidu_score: number;
  lucien_indexed: boolean;
  schema_ready: boolean;
  hreflang_languages: number;
  updated_at: string;
};

export type KnowledgeCitationGapDto = {
  topic: string;
  category: string;
  articles: number;
  published_translations: number;
  lucien_indexed: number;
  avg_seo: number;
  coverage: "strong" | "partial" | "missing";
};

export type KnowledgeArticleDetailDto = {
  id: string;
  slug: string;
  status: KnowledgeArticleStatus;
  author_name: string;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  cover_image_url: string | null;
  visibility: string;
  tags: string[];
  scheduled_at: string | null;
  timezone: string;
  published_at: string | null;
  translations: KnowledgeTranslationDto[];
  analytics: {
    view_count: number;
    helpful_count: number;
    not_helpful_count: number;
    monthly_views: number;
  };
};

export type KnowledgeTranslationDto = {
  id: string;
  language_code: string;
  path_prefix: string;
  title: string;
  subtitle: string | null;
  body_html: string;
  body_markdown: string;
  excerpt: string | null;
  reading_time_minutes: number;
  status: KnowledgeArticleStatus;
  published_at: string | null;
  updated_at: string;
  seo: KnowledgeSeoDto | null;
  faqs: KnowledgeFaqDto[];
  lucien: KnowledgeLucienDto | null;
  schema_type: KnowledgeSchemaOrgType;
};

export type KnowledgeSeoDto = {
  seo_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  keywords: string[];
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_card: string | null;
  seo_score: number;
  readability_score: number;
  ai_friendly_score: number;
  google_score: number;
  baidu_score: number;
  internal_link_count: number;
  external_link_count: number;
};

export type KnowledgeFaqDto = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type KnowledgeLucienDto = {
  ai_summary: string | null;
  ai_keywords: string[];
  ai_topics: string[];
  ai_intent: string | null;
  ai_confidence: number;
  llm_friendly: boolean;
  allow_citation: boolean;
  allow_training: boolean;
  lucien_learning: boolean;
  search_priority: number;
  category: KnowledgeLucienCategory;
  weight: number;
  priority: KnowledgeLucienPriority;
  lucien_indexed: boolean;
  lucien_synced_at: string | null;
};

export type PublicKnowledgeArticleDto = {
  id: string;
  slug: string;
  language_code: string;
  path_prefix: KnowledgePathPrefix;
  title: string;
  subtitle: string | null;
  body_html: string;
  body_markdown: string;
  excerpt: string | null;
  reading_time_minutes: number;
  author_name: string;
  cover_image_url: string | null;
  category_name: string | null;
  category_slug: string | null;
  updated_at: string;
  published_at: string | null;
  seo: KnowledgeSeoDto | null;
  faqs: KnowledgeFaqDto[];
  schema_json_ld: Record<string, unknown> | null;
  related: Array<{ slug: string; title: string; path: string; excerpt?: string | null }>;
};
