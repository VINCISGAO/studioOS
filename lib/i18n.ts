import {
  SUPPORTED_LANGUAGE_SEEDS,
  normalizeLanguageCode,
  type SupportedLanguageCode
} from "@/features/i18n/language.constants";
import { isInternalAppPath, normalizeAppLanguage, toUiLocale } from "@/lib/app-language.shared";

export const locales = ["en", "zh"] as const;
export const supportedLanguageCodes = SUPPORTED_LANGUAGE_SEEDS.map((item) => item.code);

export type Locale = (typeof locales)[number];
export type LanguageCode = SupportedLanguageCode;
export type MarketingLocale = LanguageCode;

export type SearchParams = Record<string, string | string[] | undefined>;

export function getLocale(searchParams?: SearchParams): Locale {
  /** Marketing pages only — internal app routes must use `getAppUiLocale()` from `@/lib/app-language`. */
  const raw = searchParams?.lang;
  const lang = Array.isArray(raw) ? raw[0] : raw;
  return toUiLocale(normalizeLanguageCode(lang));
}

export function getLanguageCode(searchParams?: SearchParams): LanguageCode {
  const raw = searchParams?.lang;
  const lang = Array.isArray(raw) ? raw[0] : raw;
  return normalizeLanguageCode(lang);
}

/**
 * Marketing/public pages append `?lang=`.
 * Internal app routes never carry `lang` in the URL — use getAppLanguage() server-side.
 */
export function withLocale(path: string, locale?: Locale | LanguageCode) {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const [pathname, queryString = ""] = pathWithoutHash.split("?");

  if (isInternalAppPath(pathname)) {
    const params = new URLSearchParams(queryString);
    params.delete("lang");
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}${hash}`;
  }

  const params = new URLSearchParams(queryString);
  if (locale) {
    params.set("lang", normalizeAppLanguage(locale === "zh" ? "zh-CN" : locale));
  }
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash}`;
}

/** Internal navigation — never appends ?lang=. */
export function appPath(path: string) {
  return withLocale(path);
}

/** Safe login ?next= value — pathname only. */
export function encodeBrandLoginNext(pathname: string, _search = "") {
  return encodeURIComponent(pathname);
}

/** Opens the brand campaign wizard at step 1 (skips legacy /brand/start-brief hop). */
export function brandWizardStep1Href(_locale: Locale, projectId?: string) {
  return projectId
    ? `/brand/projects/new?project=${encodeURIComponent(projectId)}&step=1`
    : "/brand/projects/new?step=1";
}

/** @deprecated Use brandWizardStep1Href */
export function brandStartBriefHref(locale: Locale) {
  return brandWizardStep1Href(locale);
}

export function isZh(locale: Locale) {
  return locale === "zh";
}

export function isChineseLanguage(locale: Locale | LanguageCode) {
  const code = normalizeAppLanguage(locale === "zh" ? "zh-CN" : locale);
  return code.startsWith("zh");
}
