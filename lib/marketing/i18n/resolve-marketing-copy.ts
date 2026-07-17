import {
  DEFAULT_LANGUAGE_CODE,
  SUPPORTED_LANGUAGE_SEEDS,
  normalizeLanguageCode,
  type SupportedLanguageCode
} from "@/features/i18n/language.constants";
import type { MarketingLocale } from "@/lib/i18n";

export const MARKETING_LANGUAGE_CODES = SUPPORTED_LANGUAGE_SEEDS.map((item) => item.code);

export function resolveMarketingLocale(value: string | null | undefined): MarketingLocale {
  return normalizeLanguageCode(value);
}

/** Pick copy for a locale with zh-* and en fallbacks. */
export function resolveMarketingCopy<T>(
  bundles: Partial<Record<MarketingLocale, T>>,
  locale: MarketingLocale | string
): T {
  const code = normalizeLanguageCode(locale);

  if (bundles[code]) return bundles[code] as T;

  if (code === "zh-TW" && bundles["zh-CN"]) return bundles["zh-CN"] as T;
  if (code.startsWith("zh") && bundles["zh-CN"]) return bundles["zh-CN"] as T;

  if (bundles.en) return bundles.en as T;

  const first = MARKETING_LANGUAGE_CODES.map((lang) => bundles[lang]).find(Boolean);
  if (first) return first as T;

  throw new Error(`Missing marketing copy bundle for locale "${code}"`);
}

export function marketingLocaleLabel(code: SupportedLanguageCode): string {
  return SUPPORTED_LANGUAGE_SEEDS.find((item) => item.code === code)?.nativeName ?? code;
}

export function isDefaultMarketingLocale(code: SupportedLanguageCode): boolean {
  return code === DEFAULT_LANGUAGE_CODE;
}

export function isChineseMarketingLocale(locale: MarketingLocale | string): boolean {
  return normalizeLanguageCode(locale).startsWith("zh");
}

/** Normalize legacy UI locale or marketing locale to canonical marketing code. */
export function asMarketingLocale(locale: string): MarketingLocale {
  if (locale === "zh") return "zh-CN";
  return normalizeLanguageCode(locale);
}

/** Map marketing locale to legacy bilingual UI locale (en/zh). */
export function toLegacyLocale(locale: MarketingLocale | "en" | "zh"): "en" | "zh" {
  return isChineseMarketingLocale(locale) ? "zh" : "en";
}
