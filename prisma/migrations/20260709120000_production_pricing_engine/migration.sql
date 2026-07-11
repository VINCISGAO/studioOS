-- VINCIS Production Pricing Engine — benchmarks, tiers, campaign estimates

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "ProductionBenchmarkStatus" AS ENUM ('DRAFT', 'VERIFIED', 'ARCHIVED');
CREATE TYPE "ProductionProjectType" AS ENUM (
  'SIMPLE_PRODUCT',
  'SOCIAL_SHORT',
  'BRAND_AD',
  'BRAND_FILM',
  'AI_DRAMA_SHORT',
  'CINEMATIC_BRAND_PROMO',
  'COMPLEX_NARRATIVE',
  'OTHER'
);
CREATE TYPE "ProductionDifficultyTier" AS ENUM (
  'SIMPLE',
  'STANDARD',
  'COMMERCIAL',
  'CINEMATIC',
  'COMPLEX'
);

CREATE TABLE "production_pricing_profiles" (
  "id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "default_generation_multiplier" DECIMAL(6,3) NOT NULL,
  "default_usable_rate" DECIMAL(6,4) NOT NULL,
  "production_unit_seconds" INTEGER NOT NULL DEFAULT 15,
  "default_hourly_rate_usd" DECIMAL(10,2) NOT NULL,
  "min_creator_profit_margin" DECIMAL(6,4) NOT NULL,
  "target_creator_profit_margin" DECIMAL(6,4) NOT NULL,
  "platform_commission_rate" DECIMAL(6,4) NOT NULL,
  "payment_cost_rate" DECIMAL(6,4) NOT NULL,
  "risk_reserve_rate" DECIMAL(6,4) NOT NULL,
  "revision_reserve_standard" DECIMAL(6,4) NOT NULL,
  "risk_buffer_standard" DECIMAL(6,4) NOT NULL,
  "tokens_per_15s_4k_generation" INTEGER NOT NULL DEFAULT 1500,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "production_pricing_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "production_pricing_profiles_version_key" ON "production_pricing_profiles"("version");

CREATE TABLE "project_complexity_tiers" (
  "id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "tier" "ProductionDifficultyTier" NOT NULL,
  "label_en" TEXT NOT NULL,
  "label_zh" TEXT NOT NULL,
  "generation_multiplier" DECIMAL(6,3) NOT NULL,
  "tokens_per_15s_unit" DECIMAL(12,2),
  "usable_rate" DECIMAL(6,4),
  "complexity_coefficient" DECIMAL(6,3),
  "avg_shot_length_seconds" DECIMAL(6,2),
  "risk_coefficient" DECIMAL(6,3) NOT NULL DEFAULT 1.0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "project_complexity_tiers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_complexity_tiers_profile_id_tier_key"
  ON "project_complexity_tiers"("profile_id", "tier");
CREATE INDEX "project_complexity_tiers_profile_id_idx" ON "project_complexity_tiers"("profile_id");

ALTER TABLE "project_complexity_tiers"
  ADD CONSTRAINT "project_complexity_tiers_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "production_pricing_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "production_benchmark_samples" (
  "id" TEXT NOT NULL,
  "sample_code" TEXT NOT NULL,
  "project_name" TEXT NOT NULL,
  "project_type" "ProductionProjectType" NOT NULL,
  "difficulty_tier" "ProductionDifficultyTier" NOT NULL,
  "status" "ProductionBenchmarkStatus" NOT NULL DEFAULT 'VERIFIED',
  "final_duration_seconds" INTEGER NOT NULL,
  "production_unit_seconds" INTEGER NOT NULL DEFAULT 15,
  "effective_unit_count" DECIMAL(10,4) NOT NULL,
  "total_shot_count" INTEGER,
  "ai_tool_spend_usd" DECIMAL(12,2),
  "ai_cost_per_15s_usd" DECIMAL(12,4),
  "ai_cost_per_second_usd" DECIMAL(12,4),
  "total_tokens_consumed" INTEGER,
  "tokens_per_15s_unit" DECIMAL(12,2),
  "tokens_per_second" DECIMAL(12,2),
  "tokens_per_single_15s_4k_gen" INTEGER,
  "total_generations" INTEGER,
  "used_generations" INTEGER,
  "generation_multiplier" DECIMAL(6,3) NOT NULL,
  "usable_rate" DECIMAL(6,4) NOT NULL,
  "complexity_coefficient" DECIMAL(6,3),
  "production_days" INTEGER,
  "hours_per_day" DECIMAL(4,1),
  "total_labor_hours" DECIMAL(8,1),
  "revision_rounds" INTEGER,
  "editing_hours" DECIMAL(8,1),
  "final_quality_score" DECIMAL(4,2),
  "data_source" TEXT NOT NULL,
  "notes" TEXT,
  "metadata_json" JSONB,
  "recorded_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "production_benchmark_samples_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "production_benchmark_samples_sample_code_key"
  ON "production_benchmark_samples"("sample_code");
CREATE INDEX "production_benchmark_samples_project_type_idx"
  ON "production_benchmark_samples"("project_type");
CREATE INDEX "production_benchmark_samples_difficulty_tier_idx"
  ON "production_benchmark_samples"("difficulty_tier");
CREATE INDEX "production_benchmark_samples_status_idx"
  ON "production_benchmark_samples"("status");

CREATE TABLE "project_cost_estimates" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "profile_version" TEXT NOT NULL,
  "difficulty_tier" "ProductionDifficultyTier" NOT NULL,
  "estimated_shot_count" INTEGER NOT NULL,
  "estimated_generations" INTEGER NOT NULL,
  "estimated_labor_hours" DECIMAL(8,1) NOT NULL,
  "tool_cost_usd" DECIMAL(12,2) NOT NULL,
  "labor_cost_usd" DECIMAL(12,2) NOT NULL,
  "revision_reserve_usd" DECIMAL(12,2) NOT NULL,
  "risk_buffer_usd" DECIMAL(12,2) NOT NULL,
  "creator_min_income_usd" DECIMAL(12,2) NOT NULL,
  "brand_floor_price_usd" DECIMAL(12,2) NOT NULL,
  "brand_suggested_price_usd" DECIMAL(12,2) NOT NULL,
  "brand_priority_price_usd" DECIMAL(12,2),
  "brand_premium_price_usd" DECIMAL(12,2),
  "estimate_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "project_cost_estimates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_cost_estimates_campaign_id_idx" ON "project_cost_estimates"("campaign_id");
CREATE INDEX "project_cost_estimates_created_at_idx" ON "project_cost_estimates"("created_at");

ALTER TABLE "project_cost_estimates"
  ADD CONSTRAINT "project_cost_estimates_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "actual_production_records" (
  "id" TEXT NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "actual_shot_count" INTEGER,
  "actual_generations" INTEGER,
  "actual_tool_cost_usd" DECIMAL(12,2),
  "actual_labor_hours" DECIMAL(8,1),
  "actual_revision_rounds" INTEGER,
  "actual_creator_income_usd" DECIMAL(12,2),
  "actual_delivery_days" INTEGER,
  "brand_satisfaction_score" DECIMAL(4,2),
  "final_profit_usd" DECIMAL(12,2),
  "actual_multiplier" DECIMAL(6,3),
  "actual_tokens" INTEGER,
  "record_json" JSONB,
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "actual_production_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "actual_production_records_campaign_id_key"
  ON "actual_production_records"("campaign_id");

ALTER TABLE "actual_production_records"
  ADD CONSTRAINT "actual_production_records_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
