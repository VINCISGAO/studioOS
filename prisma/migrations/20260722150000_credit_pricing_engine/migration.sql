-- Credit pricing engine fields + default model rules

ALTER TABLE "credit_pricing_rules"
  ADD COLUMN IF NOT EXISTS "mode" TEXT,
  ADD COLUMN IF NOT EXISTS "label" TEXT,
  ADD COLUMN IF NOT EXISTS "margin_percent" INTEGER,
  ADD COLUMN IF NOT EXISTS "refund_on_failure" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "minimum_balance" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "credit_pricing_rules_generation_type_model_mode_enabled_idx"
  ON "credit_pricing_rules"("generation_type", "model", "mode", "enabled");

INSERT INTO "credit_pricing_rules" (
  "id", "provider", "model", "generation_type", "mode", "label",
  "duration_sec", "resolution", "output_count", "provider_cost_minor",
  "credit_price", "margin_percent", "refund_on_failure", "minimum_balance",
  "enabled", "sort_order", "updated_at"
)
VALUES
  ('rule_seedance2_t2v_5s_720p', 'ByteDance', 'seedance-2.0', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 · Text to video · 5s · 720p', 5, '720p', 1, 4200, 60, 43, true, 0, true, 10, CURRENT_TIMESTAMP),
  ('rule_seedance2_i2v_5s_1080p', 'ByteDance', 'seedance-2.0', 'VIDEO', 'IMAGE_TO_VIDEO', 'Seedance 2.0 · Image to video · 5s · 1080p', 5, '1080p', 1, 6300, 90, 43, true, 0, true, 11, CURRENT_TIMESTAMP),
  ('rule_seedance2_fast_t2v_5s_720p', 'ByteDance', 'seedance-2.0-fast', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 Fast · Text to video · 5s · 720p', 5, '720p', 1, 3500, 51, 46, true, 0, true, 12, CURRENT_TIMESTAMP),
  ('rule_kling3_t2v_5s_720p', 'Kling', 'kling-3.0', 'VIDEO', 'TEXT_TO_VIDEO', 'Kling 3.0 · Text to video · 5s · 720p', 5, '720p', 1, 5000, 75, 50, true, 0, true, 20, CURRENT_TIMESTAMP),
  ('rule_kling3_i2v_5s_1080p', 'Kling', 'kling-3.0', 'VIDEO', 'IMAGE_TO_VIDEO', 'Kling 3.0 · Image to video · 5s · 1080p', 5, '1080p', 1, 7200, 110, 53, true, 0, true, 21, CURRENT_TIMESTAMP),
  ('rule_veo3_t2v_8s_1080p', 'Google', 'veo-3.1', 'VIDEO', 'TEXT_TO_VIDEO', 'Veo 3.1 · Text to video · 8s · 1080p', 8, '1080p', 1, 12000, 180, 50, true, 0, true, 30, CURRENT_TIMESTAMP),
  ('rule_veo3_fast_t2v_8s_1080p', 'Google', 'veo-3.1-fast', 'VIDEO', 'TEXT_TO_VIDEO', 'Veo 3.1 Fast · Text to video · 8s · 1080p', 8, '1080p', 1, 9000, 140, 56, true, 0, true, 31, CURRENT_TIMESTAMP),
  ('rule_image_t2i_1k', 'OpenAI', 'nano-banana-2', 'IMAGE', 'TEXT_TO_IMAGE', 'Image · Text to image · 1K', NULL, '1024', 1, 900, 15, 67, true, 0, true, 40, CURRENT_TIMESTAMP),
  ('rule_image_i2i_1k', 'OpenAI', 'nano-banana-2', 'IMAGE', 'IMAGE_TO_IMAGE', 'Image · Image to image · 1K', NULL, '1024', 1, 1200, 20, 67, true, 0, true, 41, CURRENT_TIMESTAMP),
  ('rule_music_custom_30s', 'Suno', 'v7.5-all', 'MUSIC', 'CUSTOM', 'Music · Custom · 30s', 30, NULL, 1, 600, 8, 33, true, 0, true, 50, CURRENT_TIMESTAMP),
  ('rule_music_simple_30s', 'Suno', 'v7.5-all', 'MUSIC', 'SIMPLE', 'Music · Simple · 30s', 30, NULL, 1, 450, 6, 33, true, 0, true, 51, CURRENT_TIMESTAMP),
  ('rule_music_soundtrack_30s', 'Suno', 'v7.5-all', 'MUSIC', 'SOUNDTRACK', 'Music · Soundtrack · 30s', 30, NULL, 1, 750, 10, 33, true, 0, true, 52, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
