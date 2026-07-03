import {
  SUPPORTED_LANGUAGE_SEEDS,
  normalizeLanguageCode,
  type SupportedLanguageCode
} from "@/features/i18n/language.constants";

export const locales = ["en", "zh"] as const;
export const supportedLanguageCodes = SUPPORTED_LANGUAGE_SEEDS.map((item) => item.code);

export type Locale = (typeof locales)[number];
export type LanguageCode = SupportedLanguageCode;

export type SearchParams = Record<string, string | string[] | undefined>;

export function getLocale(searchParams?: SearchParams): Locale {
  const raw = searchParams?.lang;
  const lang = Array.isArray(raw) ? raw[0] : raw;
  return lang === "zh" || lang === "zh-CN" || lang === "zh-TW" ? "zh" : "en";
}

export function getLanguageCode(searchParams?: SearchParams): LanguageCode {
  const raw = searchParams?.lang;
  const lang = Array.isArray(raw) ? raw[0] : raw;
  return normalizeLanguageCode(lang);
}

export function withLocale(path: string, locale: Locale) {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const [pathname, queryString = ""] = pathWithoutHash.split("?");
  const params = new URLSearchParams(queryString);
  params.set("lang", locale);
  return `${pathname}?${params.toString()}${hash}`;
}

/** Safe login ?next= value — avoid double-encoded lang%3Dzh query strings. */
export function encodeBrandLoginNext(pathname: string, search: string) {
  const params = new URLSearchParams(search);
  const lang = params.get("lang");
  const next = lang ? `${pathname}?lang=${normalizeLanguageCode(lang)}` : pathname;
  return encodeURIComponent(next);
}

/** Opens the brand campaign wizard with a fresh draft project. */
export function brandStartBriefHref(locale: Locale) {
  return withLocale("/brand/start-brief", locale);
}

export function isZh(locale: Locale) {
  return locale === "zh";
}
