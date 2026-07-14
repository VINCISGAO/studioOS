import {
  buildKnowledgeArticlePath,
  KNOWLEDGE_LANGUAGE_OPTIONS,
  knowledgeHreflangForCode,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";

const ORIGIN = "https://vincis.app";

export type KnowledgeHreflangAlternate = {
  hreflang: string;
  url: string;
  languageCode: string;
};

export function buildKnowledgeArticleAlternates(input: {
  slug: string;
  publishedLanguageCodes: string[];
  currentLanguageCode: string;
}): KnowledgeHreflangAlternate[] {
  const published = new Set(input.publishedLanguageCodes);
  const alternates: KnowledgeHreflangAlternate[] = [];

  for (const lang of KNOWLEDGE_LANGUAGE_OPTIONS) {
    if (!published.has(lang.code)) continue;
    alternates.push({
      languageCode: lang.code,
      hreflang: knowledgeHreflangForCode(lang.code),
      url: `${ORIGIN}${buildKnowledgeArticlePath(knowledgePathPrefixForCode(lang.code), input.slug)}`
    });
  }

  return alternates;
}

export function knowledgeAlternatesToMetadataLanguages(alternates: KnowledgeHreflangAlternate[]) {
  const languages: Record<string, string> = {};
  for (const item of alternates) {
    languages[item.hreflang] = item.url;
  }
  const defaultUrl = alternates.find((item) => item.languageCode === "en")?.url ?? alternates[0]?.url;
  if (defaultUrl) {
    languages["x-default"] = defaultUrl;
  }
  return languages;
}
