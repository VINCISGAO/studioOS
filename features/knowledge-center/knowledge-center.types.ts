import type {
  KnowledgeArticleStatus,
  KnowledgeLucienCategory,
  KnowledgeLucienPriority,
  KnowledgeSchemaOrgType
} from "@prisma/client";

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
  status: KnowledgeArticleStatus;
  language_code: string;
  author_name: string;
  updated_at: string;
  seo_score: number;
  lucien_indexed: boolean;
  view_count: number;
};

export type KnowledgeDashboardStatsDto = {
  articles: number;
  published: number;
  draft: number;
  languages: number;
  lucien_indexed: number;
  google_indexed: number;
  baidu_indexed: number;
  avg_seo: number;
  monthly_views: number;
};

export type KnowledgeCitationGapDto = {
  topic: string;
  category: string;
  articles: number;
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
  path_prefix: string;
  title: string;
  subtitle: string | null;
  body_markdown: string;
  excerpt: string | null;
  reading_time_minutes: number;
  author_name: string;
  cover_image_url: string | null;
  category_name: string | null;
  updated_at: string;
  published_at: string | null;
  seo: KnowledgeSeoDto | null;
  faqs: KnowledgeFaqDto[];
  schema_json_ld: Record<string, unknown> | null;
  related: Array<{ slug: string; title: string; path: string }>;
};
