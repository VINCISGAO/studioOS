-- CampaignVersion upload metadata (Phase 5)
ALTER TABLE "campaign_versions" ADD COLUMN IF NOT EXISTS "file_name" TEXT;
ALTER TABLE "campaign_versions" ADD COLUMN IF NOT EXISTS "mime_type" TEXT;
ALTER TABLE "campaign_versions" ADD COLUMN IF NOT EXISTS "file_size_bytes" INTEGER;
