export const KNOWLEDGE_CENTER_SOURCE_TYPE = "knowledge_center" as const;

/** 11 public locales — aligned with marketing homepage + hreflang. */
export const KNOWLEDGE_LANGUAGE_OPTIONS = [
  { code: "en", pathPrefix: "en", hreflang: "en", label: "English" },
  { code: "zh-CN", pathPrefix: "zh", hreflang: "zh-CN", label: "Chinese (Simplified)" },
  { code: "zh-TW", pathPrefix: "zh-tw", hreflang: "zh-TW", label: "Chinese (Traditional)" },
  { code: "ja", pathPrefix: "ja", hreflang: "ja", label: "Japanese" },
  { code: "ko", pathPrefix: "ko", hreflang: "ko", label: "Korean" },
  { code: "ms", pathPrefix: "ms", hreflang: "ms", label: "Malay" },
  { code: "km", pathPrefix: "km", hreflang: "km", label: "Khmer" },
  { code: "th", pathPrefix: "th", hreflang: "th", label: "Thai" },
  { code: "vi", pathPrefix: "vi", hreflang: "vi", label: "Vietnamese" },
  { code: "fr", pathPrefix: "fr", hreflang: "fr", label: "French" },
  { code: "es", pathPrefix: "es", hreflang: "es", label: "Spanish" }
] as const;

export type KnowledgeLanguageCode = (typeof KNOWLEDGE_LANGUAGE_OPTIONS)[number]["code"];
export type KnowledgePathPrefix = (typeof KNOWLEDGE_LANGUAGE_OPTIONS)[number]["pathPrefix"];

export const KNOWLEDGE_DEFAULT_CATEGORIES = [
  { slug: "brand-academy", name: "Brand Academy" },
  { slug: "creator-academy", name: "Creator Academy" },
  { slug: "workflow", name: "Workflow" },
  { slug: "pricing", name: "Pricing" },
  { slug: "ai", name: "AI" },
  { slug: "legal", name: "Legal" },
  { slug: "help-center", name: "Help Center" }
] as const;

export function knowledgePathPrefixForCode(languageCode: string): KnowledgePathPrefix {
  const match = KNOWLEDGE_LANGUAGE_OPTIONS.find((item) => item.code === languageCode);
  return match?.pathPrefix ?? "en";
}

export function knowledgeCodeForPathPrefix(pathPrefix: string): KnowledgeLanguageCode {
  const normalized = pathPrefix === "zh-TW" ? "zh-tw" : pathPrefix;
  const match = KNOWLEDGE_LANGUAGE_OPTIONS.find((item) => item.pathPrefix === normalized);
  return match?.code ?? "en";
}

export function knowledgeHreflangForCode(languageCode: string): string {
  const match = KNOWLEDGE_LANGUAGE_OPTIONS.find((item) => item.code === languageCode);
  return match?.hreflang ?? languageCode;
}

export function isKnowledgePathPrefix(value: string): value is KnowledgePathPrefix {
  return KNOWLEDGE_LANGUAGE_OPTIONS.some((item) => item.pathPrefix === value);
}

export function buildKnowledgeArticlePath(pathPrefix: KnowledgePathPrefix, slug: string) {
  return `/${pathPrefix}/resources/${slug}`;
}

export function buildKnowledgeLucienSourceKey(slug: string, languageCode: string) {
  return `knowledge_center_${slug}_${languageCode.replace("-", "_").toLowerCase()}`;
}
