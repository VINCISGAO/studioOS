-- Mureka-backed Canvas music credit pricing (+10% service fee on Mureka USD cost).
-- Canonical table: docs/MUREKA_CREDITS_PRICING.md

UPDATE "ai_models"
SET
  "provider" = 'Mureka',
  "base_credit_price" = 4,
  "provider_cost_minor" = 3,
  "margin_percent" = 25,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "internal_model_id" IN ('v7.5-basic', 'v7.5-all');

UPDATE "ai_models"
SET
  "provider" = 'Mureka',
  "base_credit_price" = 5,
  "provider_cost_minor" = 5,
  "margin_percent" = 9,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "internal_model_id" = 'v7.5-studio';

-- v7.5-all: mirror basic tier rules (auto ≈ V7.6 pricing)
INSERT INTO "credit_pricing_rules" (
  "id", "ai_model_id", "provider", "model", "generation_type", "mode", "label",
  "duration_sec", "resolution", "output_count", "provider_cost_minor",
  "credit_price", "margin_percent", "refund_on_failure", "minimum_balance",
  "enabled", "status", "sort_order", "updated_at", "published_at"
) VALUES
  ('rule_music_all_simple_30s', 'aim_v75_all', 'Mureka', 'v7.5-all', 'MUSIC', 'SIMPLE', 'Music · All · Simple · 30s', 30, NULL, 1, 3, 4, 25, true, 0, true, 'PUBLISHED', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('rule_music_all_custom_30s', 'aim_v75_all', 'Mureka', 'v7.5-all', 'MUSIC', 'CUSTOM', 'Music · All · Custom vocal · 30s', 30, NULL, 1, 4, 5, 20, true, 0, true, 'PUBLISHED', 51, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('rule_music_all_soundtrack_30s', 'aim_v75_all', 'Mureka', 'v7.5-all', 'MUSIC', 'SOUNDTRACK', 'Music · All · Soundtrack · 30s', 30, NULL, 1, 3, 4, 25, true, 0, true, 'PUBLISHED', 52, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "provider" = EXCLUDED."provider",
  "provider_cost_minor" = EXCLUDED."provider_cost_minor",
  "credit_price" = EXCLUDED."credit_price",
  "margin_percent" = EXCLUDED."margin_percent",
  "refund_on_failure" = EXCLUDED."refund_on_failure",
  "enabled" = EXCLUDED."enabled",
  "status" = EXCLUDED."status",
  "updated_at" = CURRENT_TIMESTAMP;

UPDATE "credit_pricing_rules"
SET
  "provider" = 'Mureka',
  "provider_cost_minor" = 3,
  "credit_price" = 4,
  "margin_percent" = 25,
  "refund_on_failure" = true,
  "enabled" = true,
  "status" = 'PUBLISHED',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" IN ('rule_music_basic_simple_30s', 'rule_music_basic_soundtrack_30s');

UPDATE "credit_pricing_rules"
SET
  "provider" = 'Mureka',
  "provider_cost_minor" = 4,
  "credit_price" = 5,
  "margin_percent" = 20,
  "refund_on_failure" = true,
  "enabled" = true,
  "status" = 'PUBLISHED',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_music_basic_custom_30s';

UPDATE "credit_pricing_rules"
SET
  "provider" = 'Mureka',
  "provider_cost_minor" = 5,
  "credit_price" = 5,
  "margin_percent" = 9,
  "refund_on_failure" = true,
  "enabled" = true,
  "status" = 'PUBLISHED',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" IN ('rule_music_studio_simple_30s', 'rule_music_studio_soundtrack_30s');

UPDATE "credit_pricing_rules"
SET
  "provider" = 'Mureka',
  "provider_cost_minor" = 5,
  "credit_price" = 6,
  "margin_percent" = 17,
  "refund_on_failure" = true,
  "enabled" = true,
  "status" = 'PUBLISHED',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'rule_music_studio_custom_30s';
