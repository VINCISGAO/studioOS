import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/lib/auth-config";
import { normalizeAppLanguage } from "@/lib/app-language.shared";
import type { MarketingLocale } from "@/lib/i18n";
import type { SearchParams } from "@/lib/i18n";
import { resolveMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";

export function marketingLocaleFromSearchParams(searchParams?: SearchParams): MarketingLocale | null {
  const raw = searchParams?.lang;
  const lang = Array.isArray(raw) ? raw[0] : raw;
  return lang ? resolveMarketingLocale(lang) : null;
}

export async function getMarketingPageLocale(searchParams?: SearchParams): Promise<MarketingLocale> {
  const fromQuery = marketingLocaleFromSearchParams(searchParams);
  if (fromQuery) return fromQuery;

  const cookieStore = await cookies();
  const cookieLang = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieLang) return resolveMarketingLocale(normalizeAppLanguage(cookieLang));

  return "zh-CN";
}
