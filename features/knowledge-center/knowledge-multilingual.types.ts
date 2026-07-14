import type { KnowledgeFaqInput, UpsertKnowledgeArticleInput } from "@/features/knowledge-center/knowledge-center.types";

export type KnowledgeMultilingualSourceBundle = {
  language_code: string;
  title: string;
  subtitle?: string;
  body_markdown: string;
  excerpt?: string;
  seo?: UpsertKnowledgeArticleInput["translation"]["seo"];
  faqs?: KnowledgeFaqInput[];
  lucien?: UpsertKnowledgeArticleInput["translation"]["lucien"];
};

export type KnowledgeMultilingualSyncResult = {
  translations_synced: number;
  translation_languages: string[];
  errors: string[];
};

export type KnowledgeTranslatedLocalePayload = {
  title: string;
  subtitle?: string;
  body_markdown: string;
  excerpt?: string;
  seo_title?: string;
  meta_description?: string;
  keywords?: string[];
  faqs?: KnowledgeFaqInput[];
};
