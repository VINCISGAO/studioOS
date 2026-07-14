export const KNOWLEDGE_CENTER_SOURCE_TYPE = "knowledge_center" as const;

export const KNOWLEDGE_LANGUAGE_OPTIONS = [
  { code: "en", pathPrefix: "en", label: "English" },
  { code: "zh-CN", pathPrefix: "zh", label: "Chinese" },
  { code: "ja", pathPrefix: "ja", label: "Japanese" },
  { code: "ko", pathPrefix: "ko", label: "Korean" },
  { code: "th", pathPrefix: "th", label: "Thai" },
  { code: "vi", pathPrefix: "vi", label: "Vietnamese" },
  { code: "fr", pathPrefix: "fr", label: "French" },
  { code: "es", pathPrefix: "es", label: "Spanish" }
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
  const match = KNOWLEDGE_LANGUAGE_OPTIONS.find((item) => item.pathPrefix === pathPrefix);
  return match?.code ?? "en";
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
