import {
  buildKnowledgeIndexPath,
  knowledgePathPrefixForCode
} from "@/features/knowledge-center/knowledge-center.constants";
import { appPath } from "@/lib/i18n";
import type { LanguageCode, Locale, MarketingLocale } from "@/lib/i18n";
import type { SupportedLanguageCode } from "@/features/i18n/language.constants";
import { normalizeAppLanguage } from "@/lib/app-language.shared";

function toLanguageCode(locale: Locale | LanguageCode | MarketingLocale): SupportedLanguageCode {
  if (locale === "zh") return "zh-CN";
  return normalizeAppLanguage(locale);
}

/** Marketing/public href with `?lang=` — homepage and public pages only. */
export function buildLocalizedHref(path: string, locale: Locale | LanguageCode | MarketingLocale): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return buildLocalizedHref("/", locale);
  }

  const hashIndex = trimmed.indexOf("#");
  const hash = hashIndex >= 0 ? trimmed.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const [pathname, queryString = ""] = withoutHash.split("?");
  const params = new URLSearchParams(queryString);
  params.set("lang", toLanguageCode(locale));
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash}`;
}

/** Knowledge Center index — locale-specific path prefix, not `?lang=`. */
export function marketingKnowledgeCenterHref(locale: Locale | LanguageCode | MarketingLocale): string {
  const prefix = knowledgePathPrefixForCode(toLanguageCode(locale));
  return buildKnowledgeIndexPath(prefix);
}

export const marketingHomeHref = {
  home: (locale: Locale | LanguageCode | MarketingLocale) => buildLocalizedHref("/", locale),
  brand: (_locale?: Locale | LanguageCode | MarketingLocale) => appPath("/brand"),
  studio: (_locale?: Locale | LanguageCode | MarketingLocale) => appPath("/studio"),
  login: (_locale?: Locale | LanguageCode | MarketingLocale) => appPath("/login"),
  works: (locale: Locale | LanguageCode | MarketingLocale, playId?: string) => {
    const base = playId ? `/cases?play=${encodeURIComponent(playId)}` : "/cases";
    return buildLocalizedHref(base, locale);
  },
  contact: (locale: Locale | LanguageCode | MarketingLocale) => buildLocalizedHref("/contact", locale),
  about: (locale: Locale | LanguageCode | MarketingLocale) => buildLocalizedHref("/about", locale)
};
