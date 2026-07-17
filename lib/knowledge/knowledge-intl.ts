import type { MarketingLocale } from "@/lib/i18n";
import { isChineseMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";

export function knowledgeIntlLocale(locale: MarketingLocale): string {
  return locale;
}

export function knowledgeShortMonthLocale(locale: MarketingLocale): string {
  return isChineseMarketingLocale(locale) ? "zh-CN" : locale;
}

export function formatKnowledgeTemplate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}
