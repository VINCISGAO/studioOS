CREATE TYPE "ProductionBenchmarkSourceType" AS ENUM ('VERIFIED', 'DERIVED');

ALTER TABLE "production_benchmark_samples"
  ADD COLUMN "source_type" "ProductionBenchmarkSourceType" NOT NULL DEFAULT 'VERIFIED',
  ADD COLUMN "assumption_text" TEXT,
  ADD COLUMN "confidence_level" TEXT;

ALTER TABLE "project_cost_estimates"
  ADD COLUMN "estimate_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "model_version" TEXT NOT NULL DEFAULT 'v1',
  ADD COLUMN "is_adopted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "adopted_at" TIMESTAMP(3),
  ADD COLUMN "input_snapshot_json" JSONB;

UPDATE "production_benchmark_samples"
SET
  "source_type" = 'DERIVED',
  "assumption_text" = '1500 Token per 15s 4K generation',
  "confidence_level" = 'derived_from_token_ledger'
WHERE "sample_code" = 'SAMPLE_002';

UPDATE "production_benchmark_samples"
SET
  "source_type" = 'VERIFIED',
  "confidence_level" = 'owner_recharge_ledger_partial'
WHERE "sample_code" = 'SAMPLE_001';
