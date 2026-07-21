-- Standalone canvases have no campaign; campaign_id must be nullable on creative_canvases.
ALTER TABLE "creative_canvases" ALTER COLUMN "campaign_id" DROP NOT NULL;
