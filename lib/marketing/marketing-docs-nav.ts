import type { MarketingLocale } from "@/lib/i18n";
import docsNavBundles from "@/lib/marketing/i18n/bundles/docs-nav.json";
import { resolveMarketingCopy } from "@/lib/marketing/i18n/resolve-marketing-copy";
import type { MarketingSiteNavKey } from "@/lib/marketing/marketing-site-nav";
import {
  marketingDocsNavEn,
  marketingDocsNavZhCN
} from "@/lib/marketing/marketing-docs-nav.sources";

export type MarketingDocsNavKey = MarketingSiteNavKey;

export type MarketingDocsSidebarCopy = {
  about: string;
  cases: string;
  process: string;
  pricing: string;
  resources: string;
  faq: string;
  knowledge: string;
  backHome: string;
  aiHelpTitle: string;
  aiHelpBody: string;
  aiHelpButton: string;
};

export function marketingDocsNavText(locale: MarketingLocale): MarketingDocsSidebarCopy {
  return resolveMarketingCopy(
    {
      en: marketingDocsNavEn,
      "zh-CN": marketingDocsNavZhCN,
      ...(docsNavBundles as Partial<Record<MarketingLocale, MarketingDocsSidebarCopy>>)
    },
    locale
  );
}
