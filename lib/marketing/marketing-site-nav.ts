import type { Locale, MarketingLocale } from "@/lib/i18n";
import { buildLocalizedHref, marketingHomeHref, marketingKnowledgeCenterHref } from "@/lib/marketing/localized-href";

export type MarketingSiteNavKey =
  | "about"
  | "process"
  | "cases"
  | "pricing"
  | "resources"
  | "faq"
  | "knowledge";

export const MARKETING_SITE_NAV_ORDER: MarketingSiteNavKey[] = [
  "about",
  "process",
  "cases",
  "pricing",
  "resources",
  "faq",
  "knowledge"
];

export const MARKETING_SITE_NAV_PATHS: Record<MarketingSiteNavKey, string> = {
  about: "/about",
  process: "/how-it-works",
  cases: "/cases",
  pricing: "/pricing",
  resources: "/resources",
  faq: "/faq",
  knowledge: "/en/resources"
};

type MarketingSiteNavItemCopy = {
  label: string;
  description: string;
};

type MarketingSiteNavCopy = Record<MarketingSiteNavKey, MarketingSiteNavItemCopy>;

const zh: MarketingSiteNavCopy = {
  about: {
    label: "关于我们",
    description: "了解 VINCIS 的使命与团队"
  },
  process: {
    label: "流程",
    description: "从需求到交付的完整流程"
  },
  cases: {
    label: "案例",
    description: "探索我们的精选作品与成功故事"
  },
  pricing: {
    label: "价格",
    description: "透明灵活的定价方案"
  },
  resources: {
    label: "合作伙伴",
    description: "推荐品牌与创作者，获得长期分销佣金"
  },
  faq: {
    label: "常见问题",
    description: "平台使用、发布与付款相关解答"
  },
  knowledge: {
    label: "知识中心",
    description: "官方指南、学院内容与帮助文档"
  }
};

const en: MarketingSiteNavCopy = {
  about: {
    label: "About us",
    description: "Learn about VINCIS mission and team"
  },
  process: {
    label: "Process",
    description: "The complete flow from brief to delivery"
  },
  cases: {
    label: "Work",
    description: "Explore our selected work and success stories"
  },
  pricing: {
    label: "Pricing",
    description: "Transparent, flexible pricing plans"
  },
  resources: {
    label: "Partners",
    description: "Earn long-term referral commissions by recommending brands and creators"
  },
  faq: {
    label: "FAQ",
    description: "Answers on platform use, publishing, and payments"
  },
  knowledge: {
    label: "Knowledge Center",
    description: "Official guides, academy content, and help docs"
  }
};

export function resolveMarketingSiteNavLocale(locale: Locale | MarketingLocale): Locale {
  if (locale === "zh") return "zh";
  if (typeof locale === "string" && locale.startsWith("zh")) return "zh";
  return "en";
}

export function marketingSiteNavCopy(locale: Locale | MarketingLocale): MarketingSiteNavCopy {
  return resolveMarketingSiteNavLocale(locale) === "zh" ? zh : en;
}

export function marketingSiteNavItems(locale: Locale | MarketingLocale) {
  const copy = marketingSiteNavCopy(locale);
  return MARKETING_SITE_NAV_ORDER.map((key) => ({
    key,
    path: MARKETING_SITE_NAV_PATHS[key],
    label: copy[key].label,
    description: copy[key].description
  }));
}

export function marketingSiteNavLabels(
  locale: Locale | MarketingLocale
): Record<MarketingSiteNavKey, string> {
  const copy = marketingSiteNavCopy(locale);
  return {
    about: copy.about.label,
    process: copy.process.label,
    cases: copy.cases.label,
    pricing: copy.pricing.label,
    resources: copy.resources.label,
    faq: copy.faq.label,
    knowledge: copy.knowledge.label
  };
}

export function marketingSiteNavHref(key: MarketingSiteNavKey, locale: Locale | MarketingLocale): string {
  if (key === "about") return marketingHomeHref.about(locale);
  if (key === "knowledge") return marketingKnowledgeCenterHref(locale);
  return buildLocalizedHref(MARKETING_SITE_NAV_PATHS[key], locale);
}
