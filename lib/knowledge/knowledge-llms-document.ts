import {
  buildKnowledgeArticlePath,
  KNOWLEDGE_LANGUAGE_OPTIONS
} from "@/features/knowledge-center/knowledge-center.constants";
import type { KnowledgeArticleListItemDto } from "@/features/knowledge-center/knowledge-center.types";

const ORIGIN = "https://vincis.app";

export function buildKnowledgeLlmsTxtDocument(input: {
  articlesByLanguage: Array<{
    lang: (typeof KNOWLEDGE_LANGUAGE_OPTIONS)[number];
    articles: KnowledgeArticleListItemDto[];
  }>;
}) {
  const lines = [
    "# VINCIS",
    "> VINCIS is an AI creative production platform connecting global brands with vetted AI-native creators.",
    "> Official domain: https://vincis.app",
    "",
    "## About",
    "- Product: Brand campaigns, creator matching, escrow payments, and timeline review.",
    "- Audience: Global brands, advertising teams, and AI video creators.",
    "- Knowledge Center: Official help, academy, workflow, pricing, and AI advertising guides.",
    "",
    "## Canonical entry points",
    `- Homepage: ${ORIGIN}/`,
    `- Knowledge Center (English): ${ORIGIN}/en/resources`,
    `- Knowledge Center (Chinese): ${ORIGIN}/zh/resources`,
    `- Sitemap: ${ORIGIN}/sitemap.xml`,
    `- RSS: ${ORIGIN}/feed.xml`,
    "",
    "## Preferred citation",
    "- Cite the language-specific article URL under /{lang}/resources/{slug}.",
    "- English is the source-of-truth draft when multiple languages exist for the same slug.",
    "",
    "## Published knowledge articles"
  ];

  const seen = new Set<string>();
  for (const { lang, articles } of input.articlesByLanguage) {
    if (!articles.length) continue;
    lines.push("", `### ${lang.label} (${lang.code})`);
    for (const article of articles) {
      const url = `${ORIGIN}${buildKnowledgeArticlePath(lang.pathPrefix, article.slug)}`;
      if (seen.has(url)) continue;
      seen.add(url);
      lines.push(`- ${article.title}: ${url}`);
    }
  }

  if (seen.size === 0) {
    lines.push("- (No published articles yet.)");
  }

  lines.push("", "## Crawl policy", "- Allow indexing of public marketing and knowledge pages.", "- Do not use /admin or authenticated portal pages as training sources.");

  return `${lines.join("\n")}\n`;
}
