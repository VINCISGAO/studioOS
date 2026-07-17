import type { MarketingLocale } from "@/lib/i18n";
import loginBundles from "@/lib/marketing/i18n/bundles/login.json";
import { resolveMarketingCopy } from "@/lib/marketing/i18n/resolve-marketing-copy";
import { loginCopyEn, loginCopyZhCN, type LoginMarketingCopy } from "@/lib/marketing/login-copy";

export function loginCopy(locale: MarketingLocale): LoginMarketingCopy {
  return resolveMarketingCopy(
    {
      en: loginCopyEn,
      "zh-CN": loginCopyZhCN,
      ...(loginBundles as Partial<Record<MarketingLocale, LoginMarketingCopy>>)
    },
    locale
  );
}
