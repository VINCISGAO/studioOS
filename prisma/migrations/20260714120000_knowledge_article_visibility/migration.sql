-- AlterTable
ALTER TABLE "knowledge_articles" ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';
