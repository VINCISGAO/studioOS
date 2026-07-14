-- CreateEnum
CREATE TYPE "KnowledgeArticleStatus" AS ENUM ('DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KnowledgeSchemaOrgType" AS ENUM ('ARTICLE', 'FAQ_PAGE', 'HOW_TO', 'GUIDE', 'REVIEW', 'NEWS_ARTICLE', 'VIDEO_OBJECT');

-- CreateEnum
CREATE TYPE "KnowledgeLucienCategory" AS ENUM ('BRAND', 'CREATOR', 'PRICING', 'WORKFLOW', 'AI', 'LEGAL', 'REVIEW', 'PROMPT');

-- CreateEnum
CREATE TYPE "KnowledgeLucienPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "knowledge_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_tags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "slug" TEXT NOT NULL,
    "status" "KnowledgeArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "author_name" TEXT NOT NULL DEFAULT 'VINCIS',
    "category_id" TEXT,
    "cover_image_url" TEXT,
    "published_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_article_tags" (
    "article_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "knowledge_article_tags_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- CreateTable
CREATE TABLE "knowledge_translations" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body_markdown" TEXT NOT NULL,
    "excerpt" TEXT,
    "reading_time_minutes" INTEGER NOT NULL DEFAULT 5,
    "status" "KnowledgeArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_revisions" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "author_name" TEXT NOT NULL,
    "snapshot_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_assets" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storage_key" TEXT,
    "mime_type" TEXT,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_seo" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "seo_title" TEXT,
    "meta_description" TEXT,
    "canonical_url" TEXT,
    "keywords_json" JSONB,
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image_url" TEXT,
    "twitter_card" TEXT DEFAULT 'summary_large_image',
    "seo_score" INTEGER NOT NULL DEFAULT 0,
    "readability_score" INTEGER NOT NULL DEFAULT 0,
    "ai_friendly_score" INTEGER NOT NULL DEFAULT 0,
    "google_score" INTEGER NOT NULL DEFAULT 0,
    "baidu_score" INTEGER NOT NULL DEFAULT 0,
    "internal_link_count" INTEGER NOT NULL DEFAULT 0,
    "external_link_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_seo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_faqs" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "knowledge_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_schemas" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "schema_type" "KnowledgeSchemaOrgType" NOT NULL DEFAULT 'ARTICLE',
    "json_ld" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_lucien" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "ai_summary" TEXT,
    "ai_keywords_json" JSONB,
    "ai_topics_json" JSONB,
    "ai_intent" TEXT DEFAULT 'informational',
    "ai_confidence" INTEGER NOT NULL DEFAULT 80,
    "llm_friendly" BOOLEAN NOT NULL DEFAULT true,
    "allow_citation" BOOLEAN NOT NULL DEFAULT true,
    "allow_training" BOOLEAN NOT NULL DEFAULT false,
    "lucien_learning" BOOLEAN NOT NULL DEFAULT true,
    "search_priority" INTEGER NOT NULL DEFAULT 50,
    "category" "KnowledgeLucienCategory" NOT NULL DEFAULT 'WORKFLOW',
    "weight" INTEGER NOT NULL DEFAULT 100,
    "priority" "KnowledgeLucienPriority" NOT NULL DEFAULT 'MEDIUM',
    "lucien_indexed" BOOLEAN NOT NULL DEFAULT false,
    "lucien_synced_at" TIMESTAMP(3),
    "lucien_source_key" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_lucien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_analytics" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "not_helpful_count" INTEGER NOT NULL DEFAULT 0,
    "monthly_views" INTEGER NOT NULL DEFAULT 0,
    "google_indexed" BOOLEAN NOT NULL DEFAULT false,
    "baidu_indexed" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_embeddings" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL DEFAULT 0,
    "chunk_text" TEXT NOT NULL,
    "embedding_json" JSONB,
    "model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_search_indexes" (
    "id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "search_text" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_search_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_categories_slug_key" ON "knowledge_categories"("slug");
CREATE INDEX "knowledge_categories_sort_order_idx" ON "knowledge_categories"("sort_order");
CREATE UNIQUE INDEX "knowledge_tags_slug_key" ON "knowledge_tags"("slug");
CREATE UNIQUE INDEX "knowledge_articles_slug_key" ON "knowledge_articles"("slug");
CREATE INDEX "knowledge_articles_campaign_id_idx" ON "knowledge_articles"("campaign_id");
CREATE INDEX "knowledge_articles_status_idx" ON "knowledge_articles"("status");
CREATE INDEX "knowledge_articles_category_id_idx" ON "knowledge_articles"("category_id");
CREATE INDEX "knowledge_articles_published_at_idx" ON "knowledge_articles"("published_at");
CREATE INDEX "knowledge_articles_deleted_at_idx" ON "knowledge_articles"("deleted_at");
CREATE UNIQUE INDEX "knowledge_translations_article_id_language_code_key" ON "knowledge_translations"("article_id", "language_code");
CREATE INDEX "knowledge_translations_language_code_status_idx" ON "knowledge_translations"("language_code", "status");
CREATE INDEX "knowledge_translations_published_at_idx" ON "knowledge_translations"("published_at");
CREATE UNIQUE INDEX "knowledge_revisions_translation_id_version_number_key" ON "knowledge_revisions"("translation_id", "version_number");
CREATE INDEX "knowledge_revisions_translation_id_created_at_idx" ON "knowledge_revisions"("translation_id", "created_at");
CREATE INDEX "knowledge_assets_translation_id_idx" ON "knowledge_assets"("translation_id");
CREATE UNIQUE INDEX "knowledge_seo_translation_id_key" ON "knowledge_seo"("translation_id");
CREATE INDEX "knowledge_faqs_translation_id_sort_order_idx" ON "knowledge_faqs"("translation_id", "sort_order");
CREATE UNIQUE INDEX "knowledge_schemas_translation_id_key" ON "knowledge_schemas"("translation_id");
CREATE UNIQUE INDEX "knowledge_lucien_translation_id_key" ON "knowledge_lucien"("translation_id");
CREATE UNIQUE INDEX "knowledge_lucien_lucien_source_key_key" ON "knowledge_lucien"("lucien_source_key");
CREATE INDEX "knowledge_lucien_lucien_indexed_idx" ON "knowledge_lucien"("lucien_indexed");
CREATE INDEX "knowledge_lucien_category_idx" ON "knowledge_lucien"("category");
CREATE UNIQUE INDEX "knowledge_analytics_article_id_key" ON "knowledge_analytics"("article_id");
CREATE UNIQUE INDEX "knowledge_embeddings_translation_id_chunk_index_key" ON "knowledge_embeddings"("translation_id", "chunk_index");
CREATE INDEX "knowledge_embeddings_translation_id_idx" ON "knowledge_embeddings"("translation_id");
CREATE UNIQUE INDEX "knowledge_search_indexes_translation_id_key" ON "knowledge_search_indexes"("translation_id");
CREATE INDEX "knowledge_search_indexes_search_text_idx" ON "knowledge_search_indexes"("search_text");

-- AddForeignKey
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "knowledge_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_article_tags" ADD CONSTRAINT "knowledge_article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_article_tags" ADD CONSTRAINT "knowledge_article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "knowledge_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_translations" ADD CONSTRAINT "knowledge_translations_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_revisions" ADD CONSTRAINT "knowledge_revisions_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "knowledge_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "knowledge_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_seo" ADD CONSTRAINT "knowledge_seo_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "knowledge_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_faqs" ADD CONSTRAINT "knowledge_faqs_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "knowledge_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_schemas" ADD CONSTRAINT "knowledge_schemas_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "knowledge_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_lucien" ADD CONSTRAINT "knowledge_lucien_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "knowledge_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_analytics" ADD CONSTRAINT "knowledge_analytics_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_embeddings" ADD CONSTRAINT "knowledge_embeddings_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "knowledge_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_search_indexes" ADD CONSTRAINT "knowledge_search_indexes_translation_id_fkey" FOREIGN KEY ("translation_id") REFERENCES "knowledge_translations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
