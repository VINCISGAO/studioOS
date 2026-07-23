-- Seedance official credits + 15% VINCIS service fee (see docs/SEEDANCE_CREDITS_PRICING.md)

UPDATE "ai_models" SET
  "base_credit_price" = 69,
  "provider_cost_minor" = 60,
  "margin_percent" = 13,
  "supported_resolutions" = ARRAY['480p','720p','1080p','4k'],
  "updated_at" = CURRENT_TIMESTAMP
WHERE "internal_model_id" = 'seedance-2.0';

UPDATE "ai_models" SET
  "base_credit_price" = 58,
  "provider_cost_minor" = 50,
  "margin_percent" = 13,
  "supported_resolutions" = ARRAY['480p','720p'],
  "updated_at" = CURRENT_TIMESTAMP
WHERE "internal_model_id" = 'seedance-2.0-fast';

UPDATE "ai_models" SET
  "base_credit_price" = 35,
  "provider_cost_minor" = 30,
  "margin_percent" = 13,
  "supported_resolutions" = ARRAY['480p','720p'],
  "updated_at" = CURRENT_TIMESTAMP
WHERE "internal_model_id" = 'seedance-2.0-mini';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 60,
  "credit_price" = 69,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 · Text to video · 5s · 720p (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_t2v_5s_720p';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 150,
  "credit_price" = 173,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 · Image to video · 5s · 1080p (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_i2v_5s_1080p';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 50,
  "credit_price" = 58,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 Fast · Text to video · 5s · 720p (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_fast_t2v_5s_720p';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 30,
  "credit_price" = 35,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 Mini · Text to video · 5s · 720p (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_mini_t2v_5s_720p';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 120,
  "credit_price" = 138,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 · Text to video · 10s · 720p (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_t2v_10s_720p';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 240,
  "credit_price" = 276,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 · Text to video · 20s · 720p (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_t2v_20s_720p';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 350,
  "credit_price" = 403,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 · Text to video · 5s · 4K (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_t2v_5s_4k';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 60,
  "credit_price" = 69,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 · Text to video · default (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_t2v_default';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 50,
  "credit_price" = 58,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 Fast · Text to video · default (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_fast_t2v_default';

UPDATE "credit_pricing_rules" SET
  "provider_cost_minor" = 30,
  "credit_price" = 35,
  "margin_percent" = 13,
  "label" = 'Seedance 2.0 Mini · Text to video · default (+15%)',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_seedance2_mini_t2v_default';

INSERT INTO "credit_pricing_rules" (
  "id", "ai_model_id", "provider", "model", "generation_type", "mode", "label",
  "duration_sec", "resolution", "output_count", "provider_cost_minor",
  "credit_price", "margin_percent", "refund_on_failure", "minimum_balance",
  "enabled", "sort_order", "updated_at"
)
VALUES
  ('rule_seedance2_t2v_5s_480p', 'aim_seedance2', 'ByteDance', 'seedance-2.0', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 · Text to video · 5s · 480p (+15%)', 5, '480p', 1, 30, 35, 13, true, 0, true, 8, CURRENT_TIMESTAMP),
  ('rule_seedance2_t2v_5s_1080p', 'aim_seedance2', 'ByteDance', 'seedance-2.0', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 · Text to video · 5s · 1080p (+15%)', 5, '1080p', 1, 150, 173, 13, true, 0, true, 9, CURRENT_TIMESTAMP),
  ('rule_seedance2_fast_t2v_5s_480p', 'aim_seedance2_fast', 'ByteDance', 'seedance-2.0-fast', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 Fast · Text to video · 5s · 480p (+15%)', 5, '480p', 1, 25, 29, 13, true, 0, true, 10, CURRENT_TIMESTAMP),
  ('rule_seedance2_mini_t2v_5s_480p', 'aim_seedance2_mini', 'ByteDance', 'seedance-2.0-mini', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 Mini · Text to video · 5s · 480p (+15%)', 5, '480p', 1, 15, 18, 13, true, 0, true, 11, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
