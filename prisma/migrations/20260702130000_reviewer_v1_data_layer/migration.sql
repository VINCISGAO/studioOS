-- Reviewer V1 data layer: annotation enum values, JSON payload, indexes, campaign FK

ALTER TYPE "AnnotationType" ADD VALUE IF NOT EXISTS 'PEN';
ALTER TYPE "AnnotationType" ADD VALUE IF NOT EXISTS 'TEXT';

ALTER TABLE "review_annotations"
ADD COLUMN IF NOT EXISTS "data_json" JSONB,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "review_annotations_campaign_id_idx"
ON "review_annotations"("campaign_id");

CREATE INDEX IF NOT EXISTS "campaign_versions_review_status_idx"
ON "campaign_versions"("review_status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'review_annotations_campaign_id_fkey'
  ) THEN
    ALTER TABLE "review_annotations"
    ADD CONSTRAINT "review_annotations_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
