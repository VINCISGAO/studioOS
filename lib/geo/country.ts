import type { SupportedLanguageCode } from "@/features/i18n/language.constants";
import type { Locale } from "@/lib/i18n";
import { ISO3166_ALPHA2 } from "@/lib/geo/iso3166-alpha2";

export type CountryCode = string;

export type CountryRecord = {
  iso2: CountryCode;
  iso3: string;
  nameEn: string;
  region: string;
};

const enDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });

export const COUNTRIES: CountryRecord[] = ISO3166_ALPHA2.map((iso2) => ({
  iso2,
  iso3: iso2,
  nameEn: enDisplayNames.of(iso2) ?? iso2,
  region: "Global"
}));

export const COUNTRY_ISO2_CODES = COUNTRIES.map((country) => country.iso2);
export const ISO3166_COUNTRY_COUNT = COUNTRY_ISO2_CODES.length;

/** Re-export for audits — official ISO territory/special codes vs custom extensions. */
export {
  ISO3166_TERRITORY_AND_SPECIAL_CODES,
  ISO3166_CUSTOM_EXTENSION_CODES,
  ISO3166_SOVEREIGN_STATE_COUNT
} from "@/lib/geo/iso3166-alpha2";

const byIso2 = new Map(COUNTRIES.map((country) => [country.iso2, country]));
const legacyAliasToIso2 = buildLegacyAliasMap();

const displayNameCache = new Map<string, Intl.DisplayNames>();

function normalizeAliasKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildLegacyAliasMap() {
  const map = new Map<string, string>();
  for (const country of COUNTRIES) {
    map.set(normalizeAliasKey(country.nameEn), country.iso2);
  }
  const extras: Record<string, string> = {
    china: "CN",
    "south korea": "KR",
    "north korea": "KP",
    "united states": "US",
    "united states of america": "US",
    "united kingdom": "GB",
    "great britain": "GB",
    russia: "RU",
    "russian federation": "RU",
    "viet nam": "VN",
    vietnam: "VN",
    "czech republic": "CZ",
    turkey: "TR",
    "türkiye": "TR",
    taiwan: "TW",
    "hong kong": "HK",
    macau: "MO",
    "ivory coast": "CI",
    "cote d'ivoire": "CI",
    "côte d'ivoire": "CI",
    bolivia: "BO",
    iran: "IR",
    syria: "SY",
    laos: "LA",
    moldova: "MD",
    "north macedonia": "MK",
    palestine: "PS",
    brunei: "BN",
    eswatini: "SZ",
    swaziland: "SZ",
    spain: "ES"
  };
  for (const [alias, iso2] of Object.entries(extras)) {
    map.set(alias, iso2);
  }
  return map;
}

export function countryFlagEmoji(iso2: string): string {
  const code = iso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return [...code].map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0))).join("");
}

export function toCountryIntlLocale(language: SupportedLanguageCode | Locale): string {
  if (language === "zh" || language === "zh-CN") return "zh-Hans";
  if (language === "zh-TW") return "zh-Hant";
  return language;
}

function getDisplayNames(language: SupportedLanguageCode | Locale): Intl.DisplayNames {
  const key = toCountryIntlLocale(language);
  const cached = displayNameCache.get(key);
  if (cached) return cached;
  let display: Intl.DisplayNames;
  try {
    display = new Intl.DisplayNames([key], { type: "region" });
  } catch {
    display = new Intl.DisplayNames(["en"], { type: "region" });
  }
  displayNameCache.set(key, display);
  return display;
}

export function normalizeCountryCode(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  const alias = legacyAliasToIso2.get(normalizeAliasKey(trimmed));
  if (alias) return alias;
  return trimmed;
}

export function isKnownCountryCode(value: string | null | undefined): boolean {
  const normalized = normalizeCountryCode(value);
  return normalized.length === 2 && byIso2.has(normalized);
}

export function getCountryRecord(value: string | null | undefined): CountryRecord | null {
  const iso2 = normalizeCountryCode(value);
  if (iso2.length !== 2) return null;
  return byIso2.get(iso2) ?? null;
}

export function getCountryLocalizedName(
  value: string | null | undefined,
  language: SupportedLanguageCode | Locale
): string {
  const iso2 = normalizeCountryCode(value);
  if (!iso2) return "";
  if (iso2.length === 2 && byIso2.has(iso2)) {
    const record = byIso2.get(iso2);
    const localized = getDisplayNames(language).of(iso2);
    if (localized && localized.trim() && localized.toUpperCase() !== iso2) {
      return localized;
    }
    if (language !== "en") {
      const english = getDisplayNames("en").of(iso2);
      if (english && english.trim() && english.toUpperCase() !== iso2) {
        return english;
      }
    }
    return record?.nameEn?.trim() || iso2;
  }
  return value?.trim() ?? "";
}

export function getCountryOptions(
  locale: Locale,
  extra?: string | null
): Array<{ value: string; label: string }> {
  const collator = new Intl.Collator(locale === "zh" ? "zh-CN" : "en");
  const base = COUNTRY_ISO2_CODES.map((iso2) => ({
    value: iso2,
    label: getCountryLocalizedName(iso2, locale)
  })).sort((a, b) => collator.compare(a.label, b.label));

  const extraIso = extra ? normalizeCountryCode(extra) : "";
  if (extraIso && extraIso.length === 2 && !byIso2.has(extraIso)) {
    return [{ value: extraIso, label: getCountryLocalizedName(extraIso, locale) || extraIso }, ...base];
  }
  if (extra && !isKnownCountryCode(extra)) {
    return [{ value: extra, label: extra }, ...base];
  }
  return base;
}

/** @deprecated Use getCountryLocalizedName */
export function getCountryLabel(value: string, locale: Locale): string {
  return getCountryLocalizedName(value, locale);
}

export function formatLocationLabel(
  country: string | null | undefined,
  city: string | null | undefined,
  locale: Locale
): string {
  const iso2 = normalizeCountryCode(country);
  const countryLabel = getCountryLocalizedName(iso2, locale);
  const trimmedCity = city?.trim();
  if (trimmedCity && countryLabel) {
    return locale === "zh" ? `${countryLabel} · ${trimmedCity}` : `${trimmedCity}, ${countryLabel}`;
  }
  return countryLabel;
}

export const countries = COUNTRY_ISO2_CODES;
