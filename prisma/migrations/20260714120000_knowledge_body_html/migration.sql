-- AlterTable
ALTER TABLE "knowledge_translations" ADD COLUMN IF NOT EXISTS "body_html" TEXT NOT NULL DEFAULT '';

-- Existing rows keep body_markdown; app resolves empty body_html via markdown→HTML on read.
-- Optional backfill can be run later by admin save or a one-off script.
