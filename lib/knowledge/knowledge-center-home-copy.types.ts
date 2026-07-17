import type { LucideIcon } from "lucide-react";

export type KnowledgeCenterNavKey = "home" | "guides" | "cases" | "resources" | "changelog";

export type KnowledgeTopicSlug =
  | "ai"
  | "creator-academy"
  | "workflow"
  | "brand-academy"
  | "pricing"
  | "help-center";

export type KnowledgeTopicCardCopy = {
  slug: KnowledgeTopicSlug;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

export type KnowledgeCenterHomeCopy = {
  brandLabel: string;
  beta: string;
  back: string;
  nav: Record<KnowledgeCenterNavKey, string>;
  guideLinks: Array<{ slug: KnowledgeTopicSlug; label: string }>;
  caseLinks: Array<{ href: string; label: string }>;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchButton: string;
  hotKeywordsLabel: string;
  hotKeywords: string[];
  topicsTitle: string;
  topicsViewAll: string;
  featuredTitle: string;
  featuredViewAll: string;
  latestTitle: string;
  supportTitle: string;
  supportLucienButton: string;
  emptyFeatured: string;
  emptyLatest: string;
  minRead: string;
  articlesCount: (count: number) => string;
  indexPageTitle: string;
  indexPageDescription: string;
  searchResultsHeading: (query: string) => string;
  searchResultsCount: (count: number) => string;
  searchResultsEmpty: string;
  categoryBackLink: string;
  topics: KnowledgeTopicCardCopy[];
};
