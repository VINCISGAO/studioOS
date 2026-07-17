import { BookOpen, Clapperboard, Lightbulb, Sparkles, Target, Video } from "lucide-react";
import type { MarketingLocale } from "@/lib/i18n";
import homeBundles from "@/lib/knowledge/i18n/bundles/knowledge-center-home.json";
import {
  knowledgeCenterHomeCopyEn,
  knowledgeCenterHomeCopyZhCN,
  type KnowledgeCenterHomeCopySource
} from "@/lib/knowledge/knowledge-center-home-copy.sources";
import type {
  KnowledgeCenterHomeCopy,
  KnowledgeTopicCardCopy,
  KnowledgeTopicSlug
} from "@/lib/knowledge/knowledge-center-home-copy.types";
import { formatKnowledgeTemplate } from "@/lib/knowledge/knowledge-intl";
import { resolveMarketingCopy } from "@/lib/marketing/i18n/resolve-marketing-copy";

export type {
  KnowledgeCenterHomeCopy,
  KnowledgeCenterNavKey,
  KnowledgeTopicCardCopy,
  KnowledgeTopicSlug
} from "@/lib/knowledge/knowledge-center-home-copy.types";

const KNOWLEDGE_TOPIC_ICONS: Record<KnowledgeTopicSlug, KnowledgeTopicCardCopy["icon"]> = {
  ai: Sparkles,
  "creator-academy": Video,
  workflow: Target,
  "brand-academy": Lightbulb,
  pricing: Clapperboard,
  "help-center": BookOpen
};

function hydrateHomeCopy(source: KnowledgeCenterHomeCopySource): KnowledgeCenterHomeCopy {
  return {
    ...source,
    articlesCount: (count) => formatKnowledgeTemplate(source.articlesCountTemplate, { count }),
    searchResultsHeading: (query) =>
      formatKnowledgeTemplate(source.searchResultsHeadingTemplate, { query }),
    searchResultsCount: (count) =>
      formatKnowledgeTemplate(source.searchResultsCountTemplate, { count }),
    topics: source.topics.map((topic) => ({
      ...topic,
      icon: KNOWLEDGE_TOPIC_ICONS[topic.slug]
    }))
  };
}

export function knowledgeCenterHomeCopy(locale: MarketingLocale): KnowledgeCenterHomeCopy {
  const source = resolveMarketingCopy(
    {
      en: knowledgeCenterHomeCopyEn,
      "zh-CN": knowledgeCenterHomeCopyZhCN,
      ...(homeBundles as Partial<Record<MarketingLocale, KnowledgeCenterHomeCopySource>>)
    },
    locale
  );

  return hydrateHomeCopy(source);
}
