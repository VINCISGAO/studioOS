import type { MarketingLocale } from "@/lib/i18n";
import chromeBundles from "@/lib/knowledge/i18n/bundles/knowledge-article-chrome.json";
import {
  knowledgeArticleChromeCopyEn,
  knowledgeArticleChromeCopyZhCN,
  type KnowledgeArticleChromeCopySource
} from "@/lib/knowledge/knowledge-article-chrome-copy.sources";
import { formatKnowledgeTemplate } from "@/lib/knowledge/knowledge-intl";
import { resolveMarketingCopy } from "@/lib/marketing/i18n/resolve-marketing-copy";

export type KnowledgeArticleChromeCopy = KnowledgeArticleChromeCopySource & {
  schemaSearchName: (query: string) => string;
};

function hydrateChromeCopy(source: KnowledgeArticleChromeCopySource): KnowledgeArticleChromeCopy {
  return {
    ...source,
    schemaSearchName: (query) => formatKnowledgeTemplate(source.schemaSearchNameTemplate, { query })
  };
}

export function knowledgeArticleChromeCopy(locale: MarketingLocale): KnowledgeArticleChromeCopy {
  const source = resolveMarketingCopy(
    {
      en: knowledgeArticleChromeCopyEn,
      "zh-CN": knowledgeArticleChromeCopyZhCN,
      ...(chromeBundles as Partial<Record<MarketingLocale, KnowledgeArticleChromeCopySource>>)
    },
    locale
  );

  return hydrateChromeCopy(source);
}
