export const locales = ["en", "zh"] as const;

export type Locale = (typeof locales)[number];

export type SearchParams = Record<string, string | string[] | undefined>;

export function getLocale(searchParams?: SearchParams): Locale {
  const raw = searchParams?.lang;
  const lang = Array.isArray(raw) ? raw[0] : raw;
  return lang === "zh" ? "zh" : "en";
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

/** Opens the brand campaign wizard with a fresh draft project. */
export function brandStartBriefHref(locale: Locale) {
  return withLocale("/brand/start-brief", locale);
}

export function isZh(locale: Locale) {
  return locale === "zh";
}
