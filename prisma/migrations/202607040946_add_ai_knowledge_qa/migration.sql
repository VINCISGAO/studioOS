CREATE TABLE "ai_knowledge_qas" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "source_key" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "module" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "search_text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "not_helpful_count" INTEGER NOT NULL DEFAULT 0,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_knowledge_qas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_knowledge_qas_source_key_key" ON "ai_knowledge_qas"("source_key");
CREATE INDEX "ai_knowledge_qas_campaign_id_idx" ON "ai_knowledge_qas"("campaign_id");
CREATE INDEX "ai_knowledge_qas_language_code_idx" ON "ai_knowledge_qas"("language_code");
CREATE INDEX "ai_knowledge_qas_status_idx" ON "ai_knowledge_qas"("status");
CREATE INDEX "ai_knowledge_qas_usage_count_idx" ON "ai_knowledge_qas"("usage_count");

ALTER TABLE "ai_knowledge_qas"
ADD CONSTRAINT "ai_knowledge_qas_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
