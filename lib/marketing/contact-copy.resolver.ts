import type { MarketingLocale } from "@/lib/i18n";
import contactBundles from "@/lib/marketing/i18n/bundles/contact.json";
import { contactCopyEn, contactCopyZhCN, type ContactCopy } from "@/lib/marketing/contact-copy";
import { resolveMarketingCopy } from "@/lib/marketing/i18n/resolve-marketing-copy";

export function contactCopy(locale: MarketingLocale): ContactCopy {
  return resolveMarketingCopy(
    {
      en: contactCopyEn,
      "zh-CN": contactCopyZhCN,
      ...(contactBundles as Partial<Record<MarketingLocale, ContactCopy>>)
    },
    locale
  );
}
