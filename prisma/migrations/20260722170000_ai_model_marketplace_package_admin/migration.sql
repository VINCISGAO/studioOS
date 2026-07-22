-- Phase 2.2.1 pricing integrity + Phase 2.3 AI model marketplace & package admin

CREATE TYPE "AiModelCategory" AS ENUM ('VIDEO', 'IMAGE', 'MUSIC', 'VOICE', 'THREE_D');
CREATE TYPE "CreditPlatformAuditEntity" AS ENUM ('CREDIT_PACKAGE', 'AI_MODEL', 'PRICING_RULE');

CREATE TABLE "credit_platform_audit_logs" (
  "id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "action" TEXT NOT NULL,
  "entity_type" "CreditPlatformAuditEntity" NOT NULL,
  "entity_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credit_platform_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "credit_platform_audit_logs_entity_type_entity_id_created_at_idx"
  ON "credit_platform_audit_logs"("entity_type", "entity_id", "created_at");
CREATE INDEX "credit_platform_audit_logs_created_at_idx"
  ON "credit_platform_audit_logs"("created_at");

CREATE TABLE "ai_models" (
  "id" TEXT NOT NULL,
  "internal_model_id" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "category" "AiModelCategory" NOT NULL,
  "generation_type" "GenerationType" NOT NULL,
  "logo_url" TEXT,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "recommended" BOOLEAN NOT NULL DEFAULT false,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "base_credit_price" INTEGER,
  "provider_cost_minor" INTEGER,
  "margin_percent" INTEGER,
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_models_internal_model_id_key" ON "ai_models"("internal_model_id");
CREATE INDEX "ai_models_category_enabled_sort_order_idx" ON "ai_models"("category", "enabled", "sort_order");
CREATE INDEX "ai_models_generation_type_enabled_idx" ON "ai_models"("generation_type", "enabled");

ALTER TABLE "credit_pricing_rules"
  ADD COLUMN IF NOT EXISTS "ai_model_id" TEXT;

CREATE INDEX IF NOT EXISTS "credit_pricing_rules_ai_model_id_enabled_idx"
  ON "credit_pricing_rules"("ai_model_id", "enabled");

ALTER TABLE "credit_pricing_rules"
  ADD CONSTRAINT "credit_pricing_rules_ai_model_id_fkey"
  FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "credit_packages"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "version_label" TEXT,
  ADD COLUMN IF NOT EXISTS "region_codes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "membership_tier" TEXT,
  ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "duplicated_from_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "credit_packages_slug_key" ON "credit_packages"("slug");
CREATE INDEX IF NOT EXISTS "credit_packages_enabled_visible_sort_order_idx"
  ON "credit_packages"("enabled", "visible", "sort_order");
CREATE INDEX IF NOT EXISTS "credit_packages_deleted_at_idx" ON "credit_packages"("deleted_at");

CREATE TABLE IF NOT EXISTS "credit_package_regional_prices" (
  "id" TEXT NOT NULL,
  "package_id" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "amount_minor" INTEGER NOT NULL,
  "region_code" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credit_package_regional_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "credit_package_regional_prices_package_id_currency_region_code_key"
  ON "credit_package_regional_prices"("package_id", "currency", "region_code");
CREATE INDEX IF NOT EXISTS "credit_package_regional_prices_package_id_enabled_idx"
  ON "credit_package_regional_prices"("package_id", "enabled");

ALTER TABLE "credit_package_regional_prices"
  ADD CONSTRAINT "credit_package_regional_prices_package_id_fkey"
  FOREIGN KEY ("package_id") REFERENCES "credit_packages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ai_models" (
  "id", "internal_model_id", "display_name", "provider", "category", "generation_type",
  "enabled", "recommended", "is_default", "sort_order", "base_credit_price", "provider_cost_minor", "margin_percent", "updated_at"
) VALUES
  ('aim_seedance2', 'seedance-2.0', 'Seedance 2.0', 'ByteDance', 'VIDEO', 'VIDEO', true, true, true, 10, 60, 4200, 43, CURRENT_TIMESTAMP),
  ('aim_seedance2_fast', 'seedance-2.0-fast', 'Seedance 2.0 Fast', 'ByteDance', 'VIDEO', 'VIDEO', true, false, false, 11, 51, 3500, 46, CURRENT_TIMESTAMP),
  ('aim_seedance2_mini', 'seedance-2.0-mini', 'Seedance 2.0 Mini', 'ByteDance', 'VIDEO', 'VIDEO', true, false, false, 12, 45, 3000, 50, CURRENT_TIMESTAMP),
  ('aim_kling3', 'kling-3.0', 'Kling 3.0', 'Kling', 'VIDEO', 'VIDEO', true, true, false, 20, 75, 5000, 50, CURRENT_TIMESTAMP),
  ('aim_kling3_omni', 'kling-3.0-omni', 'Kling 3.0 Omni', 'Kling', 'VIDEO', 'VIDEO', true, false, false, 21, 85, 5600, 52, CURRENT_TIMESTAMP),
  ('aim_veo31', 'veo-3.1', 'Veo 3.1', 'Google', 'VIDEO', 'VIDEO', true, true, false, 30, 180, 12000, 50, CURRENT_TIMESTAMP),
  ('aim_veo31_fast', 'veo-3.1-fast', 'Veo 3.1 Fast', 'Google', 'VIDEO', 'VIDEO', true, false, false, 31, 140, 9000, 56, CURRENT_TIMESTAMP),
  ('aim_gemini_flash', 'gemini-omni-flash', 'Gemini Omni Flash', 'Google', 'VIDEO', 'VIDEO', true, false, false, 32, 55, 3600, 53, CURRENT_TIMESTAMP),
  ('aim_gpt_image', 'gpt-image', 'GPT Image', 'OpenAI', 'IMAGE', 'IMAGE', true, true, true, 40, 15, 900, 67, CURRENT_TIMESTAMP),
  ('aim_gpt_image_mini', 'gpt-image-mini', 'GPT Image Mini', 'OpenAI', 'IMAGE', 'IMAGE', true, false, false, 41, 10, 600, 67, CURRENT_TIMESTAMP),
  ('aim_nano_banana2', 'nano-banana-2', 'Nano Banana 2', 'nano-banana', 'IMAGE', 'IMAGE', true, true, false, 42, 15, 900, 67, CURRENT_TIMESTAMP),
  ('aim_v75_all', 'v7.5-all', 'V7.5 All', 'Suno', 'MUSIC', 'MUSIC', true, true, true, 50, 8, 600, 33, CURRENT_TIMESTAMP),
  ('aim_v75_studio', 'v7.5-studio', 'V7.5 Studio', 'Suno', 'MUSIC', 'MUSIC', true, false, false, 51, 10, 750, 33, CURRENT_TIMESTAMP),
  ('aim_v75_basic', 'v7.5-basic', 'V7.5 Basic', 'Suno', 'MUSIC', 'MUSIC', true, false, false, 52, 6, 450, 33, CURRENT_TIMESTAMP)
ON CONFLICT ("internal_model_id") DO NOTHING;

INSERT INTO "credit_pricing_rules" (
  "id", "ai_model_id", "provider", "model", "generation_type", "mode", "label",
  "duration_sec", "resolution", "output_count", "provider_cost_minor",
  "credit_price", "margin_percent", "refund_on_failure", "minimum_balance",
  "enabled", "sort_order", "updated_at"
) VALUES
  ('rule_gpt_image_t2i_1k', 'aim_gpt_image', 'OpenAI', 'gpt-image', 'IMAGE', 'TEXT_TO_IMAGE', 'GPT Image · Text to image · 1K', NULL, '1024', 1, 900, 15, 67, true, 0, true, 42, CURRENT_TIMESTAMP),
  ('rule_gpt_image_i2i_1k', 'aim_gpt_image', 'OpenAI', 'gpt-image', 'IMAGE', 'IMAGE_TO_IMAGE', 'GPT Image · Image to image · 1K', NULL, '1024', 1, 1200, 20, 67, true, 0, true, 43, CURRENT_TIMESTAMP),
  ('rule_gpt_image_mini_t2i_1k', 'aim_gpt_image_mini', 'OpenAI', 'gpt-image-mini', 'IMAGE', 'TEXT_TO_IMAGE', 'GPT Image Mini · Text to image · 1K', NULL, '1024', 1, 600, 10, 67, true, 0, true, 44, CURRENT_TIMESTAMP),
  ('rule_gpt_image_mini_i2i_1k', 'aim_gpt_image_mini', 'OpenAI', 'gpt-image-mini', 'IMAGE', 'IMAGE_TO_IMAGE', 'GPT Image Mini · Image to image · 1K', NULL, '1024', 1, 800, 14, 67, true, 0, true, 45, CURRENT_TIMESTAMP),
  ('rule_seedance2_mini_t2v_5s_720p', 'aim_seedance2_mini', 'ByteDance', 'seedance-2.0-mini', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 Mini · Text to video · 5s · 720p', 5, '720p', 1, 3000, 45, 50, true, 0, true, 13, CURRENT_TIMESTAMP),
  ('rule_kling3_omni_t2v_5s_720p', 'aim_kling3_omni', 'Kling', 'kling-3.0-omni', 'VIDEO', 'TEXT_TO_VIDEO', 'Kling 3.0 Omni · Text to video · 5s · 720p', 5, '720p', 1, 5600, 85, 52, true, 0, true, 22, CURRENT_TIMESTAMP),
  ('rule_kling3_omni_i2v_5s_1080p', 'aim_kling3_omni', 'Kling', 'kling-3.0-omni', 'VIDEO', 'IMAGE_TO_VIDEO', 'Kling 3.0 Omni · Image to video · 5s · 1080p', 5, '1080p', 1, 8000, 120, 50, true, 0, true, 23, CURRENT_TIMESTAMP),
  ('rule_gemini_flash_t2v_5s_720p', 'aim_gemini_flash', 'Google', 'gemini-omni-flash', 'VIDEO', 'TEXT_TO_VIDEO', 'Gemini Omni Flash · Text to video · 5s · 720p', 5, '720p', 1, 3600, 55, 53, true, 0, true, 33, CURRENT_TIMESTAMP),
  ('rule_music_studio_custom_30s', 'aim_v75_studio', 'Suno', 'v7.5-studio', 'MUSIC', 'CUSTOM', 'Music · Studio · Custom · 30s', 30, NULL, 1, 750, 10, 33, true, 0, true, 53, CURRENT_TIMESTAMP),
  ('rule_music_studio_simple_30s', 'aim_v75_studio', 'Suno', 'v7.5-studio', 'MUSIC', 'SIMPLE', 'Music · Studio · Simple · 30s', 30, NULL, 1, 600, 8, 33, true, 0, true, 54, CURRENT_TIMESTAMP),
  ('rule_music_studio_soundtrack_30s', 'aim_v75_studio', 'Suno', 'v7.5-studio', 'MUSIC', 'SOUNDTRACK', 'Music · Studio · Soundtrack · 30s', 30, NULL, 1, 900, 12, 33, true, 0, true, 55, CURRENT_TIMESTAMP),
  ('rule_music_basic_custom_30s', 'aim_v75_basic', 'Suno', 'v7.5-basic', 'MUSIC', 'CUSTOM', 'Music · Basic · Custom · 30s', 30, NULL, 1, 450, 6, 33, true, 0, true, 56, CURRENT_TIMESTAMP),
  ('rule_music_basic_simple_30s', 'aim_v75_basic', 'Suno', 'v7.5-basic', 'MUSIC', 'SIMPLE', 'Music · Basic · Simple · 30s', 30, NULL, 1, 350, 5, 33, true, 0, true, 57, CURRENT_TIMESTAMP),
  ('rule_music_basic_soundtrack_30s', 'aim_v75_basic', 'Suno', 'v7.5-basic', 'MUSIC', 'SOUNDTRACK', 'Music · Basic · Soundtrack · 30s', 30, NULL, 1, 550, 7, 33, true, 0, true, 58, CURRENT_TIMESTAMP),
  ('rule_seedance2_t2v_10s_720p', 'aim_seedance2', 'ByteDance', 'seedance-2.0', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 · Text to video · 10s · 720p', 10, '720p', 1, 7800, 110, 41, true, 0, true, 14, CURRENT_TIMESTAMP),
  ('rule_seedance2_t2v_20s_720p', 'aim_seedance2', 'ByteDance', 'seedance-2.0', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 · Text to video · 20s · 720p', 20, '720p', 1, 15000, 210, 40, true, 0, true, 15, CURRENT_TIMESTAMP),
  ('rule_seedance2_t2v_5s_4k', 'aim_seedance2', 'ByteDance', 'seedance-2.0', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 · Text to video · 5s · 4K', 5, '4k', 1, 9800, 140, 43, true, 0, true, 16, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

UPDATE "credit_pricing_rules" SET "ai_model_id" = 'aim_seedance2' WHERE "model" = 'seedance-2.0' AND "ai_model_id" IS NULL;
UPDATE "credit_pricing_rules" SET "ai_model_id" = 'aim_seedance2_fast' WHERE "model" = 'seedance-2.0-fast' AND "ai_model_id" IS NULL;
UPDATE "credit_pricing_rules" SET "ai_model_id" = 'aim_kling3' WHERE "model" = 'kling-3.0' AND "ai_model_id" IS NULL;
UPDATE "credit_pricing_rules" SET "ai_model_id" = 'aim_veo31' WHERE "model" = 'veo-3.1' AND "ai_model_id" IS NULL;
UPDATE "credit_pricing_rules" SET "ai_model_id" = 'aim_veo31_fast' WHERE "model" = 'veo-3.1-fast' AND "ai_model_id" IS NULL;
UPDATE "credit_pricing_rules" SET "ai_model_id" = 'aim_nano_banana2' WHERE "model" = 'nano-banana-2' AND "ai_model_id" IS NULL;
UPDATE "credit_pricing_rules" SET "ai_model_id" = 'aim_v75_all' WHERE "model" = 'v7.5-all' AND "ai_model_id" IS NULL;

UPDATE "credit_packages" SET
  "slug" = 'starter',
  "version" = 1,
  "version_label" = 'Starter V1',
  "visible" = true,
  "is_default" = true
WHERE "name" = 'Starter' AND "slug" IS NULL;

UPDATE "credit_packages" SET
  "slug" = 'creator',
  "version" = 1,
  "version_label" = 'Creator V1',
  "visible" = true
WHERE "name" = 'Creator' AND "slug" IS NULL;

UPDATE "credit_packages" SET
  "slug" = 'pro',
  "version" = 1,
  "version_label" = 'Pro V1',
  "visible" = true
WHERE "name" = 'Pro' AND "slug" IS NULL;

UPDATE "credit_packages" SET
  "slug" = 'studio',
  "version" = 1,
  "version_label" = 'Studio V1',
  "visible" = true
WHERE "name" = 'Studio' AND "slug" IS NULL;
