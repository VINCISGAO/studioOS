export function hasOpenAI() {
  return Boolean((process.env["OPENAI_API_KEY"] ?? "").trim());
}

export function openAIModel() {
  return (process.env["OPENAI_MODEL"] ?? "").trim() || "gpt-4o-mini";
}

export function openAIVisionModel() {
  return (process.env["OPENAI_VISION_MODEL"] ?? "").trim() || "gpt-4o";
}

export function openAIImageModel() {
  return (process.env["OPENAI_IMAGE_MODEL"] ?? "").trim() || "gpt-image-1";
}

export function hasMetaAds() {
  return Boolean(process.env.META_ACCESS_TOKEN?.trim() && process.env.META_AD_ACCOUNT_ID?.trim());
}

export function hasTikTokAds() {
  return Boolean(process.env.TIKTOK_ACCESS_TOKEN?.trim() && process.env.TIKTOK_ADVERTISER_ID?.trim());
}

export function metaAdAccountId() {
  const raw = process.env.META_AD_ACCOUNT_ID?.trim() ?? "";
  return raw.startsWith("act_") ? raw : `act_${raw}`;
}

export function tikTokAdvertiserId() {
  return process.env.TIKTOK_ADVERTISER_ID?.trim() ?? "";
}
