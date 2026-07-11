-- Lucien business-knowledge boundary fields
ALTER TABLE "ai_knowledge_qas" ADD COLUMN IF NOT EXISTS "knowledge_type" TEXT NOT NULL DEFAULT 'FAQ';
ALTER TABLE "ai_knowledge_qas" ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'authenticated';
ALTER TABLE "ai_knowledge_qas" ADD COLUMN IF NOT EXISTS "source_type" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "ai_knowledge_qas" ADD COLUMN IF NOT EXISTS "version" TEXT;
ALTER TABLE "ai_knowledge_qas" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3);

UPDATE "ai_knowledge_qas"
SET
  "knowledge_type" = 'FAQ',
  "visibility" = 'public',
  "source_type" = 'marketing_faq',
  "version" = 'marketing_faq_v1',
  "verified_at" = COALESCE("verified_at", NOW())
WHERE "source_key" LIKE 'marketing_faq_%';

UPDATE "ai_knowledge_qas"
SET
  "knowledge_type" = 'FAQ',
  "visibility" = 'internal',
  "source_type" = 'dev_seed',
  "status" = 'INACTIVE'
WHERE "source_key" LIKE 'studioos_qa_%';

CREATE INDEX IF NOT EXISTS "ai_knowledge_qas_language_code_status_knowledge_type_visibility_source_type_idx"
ON "ai_knowledge_qas" ("language_code", "status", "knowledge_type", "visibility", "source_type");
