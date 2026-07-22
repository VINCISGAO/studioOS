-- Fallback pricing rules for default canvas parameters and wildcard matching

INSERT INTO "credit_pricing_rules" (
  "id", "ai_model_id", "provider", "model", "generation_type", "mode", "label",
  "duration_sec", "resolution", "output_count", "provider_cost_minor",
  "credit_price", "margin_percent", "refund_on_failure", "minimum_balance",
  "enabled", "sort_order", "updated_at"
)
VALUES
  ('rule_veo31_t2v_default', 'aim_veo31', 'Google', 'veo-3.1', 'VIDEO', 'TEXT_TO_VIDEO', 'Veo 3.1 · Text to video · default', NULL, NULL, 1, 12000, 180, 50, true, 0, true, 29, CURRENT_TIMESTAMP),
  ('rule_veo31_fast_t2v_default', 'aim_veo31_fast', 'Google', 'veo-3.1-fast', 'VIDEO', 'TEXT_TO_VIDEO', 'Veo 3.1 Fast · Text to video · default', NULL, NULL, 1, 9000, 140, 56, true, 0, true, 29, CURRENT_TIMESTAMP),
  ('rule_seedance2_t2v_default', 'aim_seedance2', 'ByteDance', 'seedance-2.0', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 · Text to video · default', NULL, NULL, 1, 4200, 60, 43, true, 0, true, 9, CURRENT_TIMESTAMP),
  ('rule_seedance2_fast_t2v_default', 'aim_seedance2_fast', 'ByteDance', 'seedance-2.0-fast', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 Fast · Text to video · default', NULL, NULL, 1, 3500, 51, 46, true, 0, true, 11, CURRENT_TIMESTAMP),
  ('rule_seedance2_mini_t2v_default', 'aim_seedance2_mini', 'ByteDance', 'seedance-2.0-mini', 'VIDEO', 'TEXT_TO_VIDEO', 'Seedance 2.0 Mini · Text to video · default', NULL, NULL, 1, 3000, 45, 50, true, 0, true, 12, CURRENT_TIMESTAMP),
  ('rule_kling3_t2v_default', 'aim_kling3', 'Kling', 'kling-3.0', 'VIDEO', 'TEXT_TO_VIDEO', 'Kling 3.0 · Text to video · default', NULL, NULL, 1, 5000, 75, 50, true, 0, true, 19, CURRENT_TIMESTAMP),
  ('rule_kling3_omni_t2v_default', 'aim_kling3_omni', 'Kling', 'kling-3.0-omni', 'VIDEO', 'TEXT_TO_VIDEO', 'Kling 3.0 Omni · Text to video · default', NULL, NULL, 1, 5600, 85, 52, true, 0, true, 21, CURRENT_TIMESTAMP),
  ('rule_gemini_flash_t2v_default', 'aim_gemini_flash', 'Google', 'gemini-omni-flash', 'VIDEO', 'TEXT_TO_VIDEO', 'Gemini Omni Flash · Text to video · default', NULL, NULL, 1, 3600, 55, 53, true, 0, true, 32, CURRENT_TIMESTAMP),
  ('rule_gpt_image_t2i_default', 'aim_gpt_image', 'OpenAI', 'gpt-image', 'IMAGE', 'TEXT_TO_IMAGE', 'GPT Image · Text to image · default', NULL, NULL, 1, 900, 15, 67, true, 0, true, 39, CURRENT_TIMESTAMP),
  ('rule_gpt_image_mini_t2i_default', 'aim_gpt_image_mini', 'OpenAI', 'gpt-image-mini', 'IMAGE', 'TEXT_TO_IMAGE', 'GPT Image Mini · Text to image · default', NULL, NULL, 1, 600, 10, 67, true, 0, true, 43, CURRENT_TIMESTAMP),
  ('rule_nano_banana2_t2i_default', 'aim_nano_banana2', 'OpenAI', 'nano-banana-2', 'IMAGE', 'TEXT_TO_IMAGE', 'Nano Banana 2 · Text to image · default', NULL, NULL, 1, 900, 15, 67, true, 0, true, 39, CURRENT_TIMESTAMP),
  ('rule_music_all_default', 'aim_v75_all', 'Suno', 'v7.5-all', 'MUSIC', NULL, 'Music · V7.5 All · default', NULL, NULL, 1, 600, 8, 33, true, 0, true, 49, CURRENT_TIMESTAMP),
  ('rule_music_studio_default', 'aim_v75_studio', 'Suno', 'v7.5-studio', 'MUSIC', NULL, 'Music · V7.5 Studio · default', NULL, NULL, 1, 750, 10, 33, true, 0, true, 52, CURRENT_TIMESTAMP),
  ('rule_music_basic_default', 'aim_v75_basic', 'Suno', 'v7.5-basic', 'MUSIC', NULL, 'Music · V7.5 Basic · default', NULL, NULL, 1, 450, 6, 33, true, 0, true, 55, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
