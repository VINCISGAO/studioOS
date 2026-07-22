-- Phase 2.4B: Versioned pricing rule lifecycle

CREATE TYPE "CreditPricingRuleStatus" AS ENUM ('DRAFT', 'VALIDATED', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "credit_pricing_rules"
  ADD COLUMN IF NOT EXISTS "aspect_ratio" TEXT,
  ADD COLUMN IF NOT EXISTS "input_type" TEXT,
  ADD COLUMN IF NOT EXISTS "margin_amount_minor" INTEGER,
  ADD COLUMN IF NOT EXISTS "status" "CreditPricingRuleStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "source_rule_id" TEXT,
  ADD COLUMN IF NOT EXISTS "replaces_rule_id" TEXT,
  ADD COLUMN IF NOT EXISTS "change_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "internal_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "published_by_user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "publish_idempotency_key" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "credit_pricing_rules_publish_idempotency_key_key"
  ON "credit_pricing_rules"("publish_idempotency_key");

CREATE INDEX IF NOT EXISTS "credit_pricing_rules_status_starts_at_ends_at_idx"
  ON "credit_pricing_rules"("status", "starts_at", "ends_at");

CREATE INDEX IF NOT EXISTS "credit_pricing_rules_generation_type_model_status_idx"
  ON "credit_pricing_rules"("generation_type", "model", "status");

CREATE TABLE IF NOT EXISTS "credit_pricing_rule_versions" (
  "id" TEXT NOT NULL,
  "rule_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "change_reason" TEXT,
  "published_at" TIMESTAMP(3) NOT NULL,
  "published_by_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credit_pricing_rule_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "credit_pricing_rule_versions_rule_id_version_key"
  ON "credit_pricing_rule_versions"("rule_id", "version");

CREATE INDEX IF NOT EXISTS "credit_pricing_rule_versions_rule_id_published_at_idx"
  ON "credit_pricing_rule_versions"("rule_id", "published_at");

ALTER TABLE "credit_pricing_rule_versions"
  ADD CONSTRAINT "credit_pricing_rule_versions_rule_id_fkey"
  FOREIGN KEY ("rule_id") REFERENCES "credit_pricing_rules"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "generation_jobs"
  ADD COLUMN IF NOT EXISTS "pricing_rule_id" TEXT,
  ADD COLUMN IF NOT EXISTS "pricing_rule_version" INTEGER,
  ADD COLUMN IF NOT EXISTS "credits_quoted" INTEGER,
  ADD COLUMN IF NOT EXISTS "provider_cost_snapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "quoted_at" TIMESTAMP(3);

-- Existing seeded rules were live pricing; mark them published.
UPDATE "credit_pricing_rules"
SET
  "status" = 'PUBLISHED',
  "enabled" = true,
  "published_at" = COALESCE("published_at", NOW()),
  "version" = COALESCE("version", 1)
WHERE "status" = 'DRAFT';
