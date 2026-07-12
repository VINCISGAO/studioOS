import {
  normalizeLanguageCode,
  type SupportedLanguageCode
} from "@/features/i18n/language.constants";
import type { Locale } from "@/lib/i18n";

export type DisplayCurrencyCode =
  | "USD"
  | "CNY"
  | "TWD"
  | "JPY"
  | "KRW"
  | "THB"
  | "VND"
  | "EUR"
  | "MYR"
  | "KHR"
  | "IDR";

/** Reference display rates only — settlement / storage remain USD. */
export const USD_REFERENCE_RATES: Record<DisplayCurrencyCode, number> = {
  USD: 1,
  CNY: 7.2,
  TWD: 32,
  JPY: 150,
  KRW: 1380,
  THB: 36,
  VND: 25000,
  EUR: 0.92,
  MYR: 4.7,
  KHR: 4100,
  IDR: 15800
};

const ZERO_DECIMAL_CURRENCIES = new Set<DisplayCurrencyCode>([
  "JPY",
  "KRW",
  "VND",
  "IDR",
  "KHR"
]);

const INTL_LOCALE_BY_CURRENCY: Record<DisplayCurrencyCode, string> = {
  USD: "en-US",
  CNY: "zh-CN",
  TWD: "zh-TW",
  JPY: "ja-JP",
  KRW: "ko-KR",
  THB: "th-TH",
  VND: "vi-VN",
  EUR: "de-DE",
  MYR: "ms-MY",
  KHR: "km-KH",
  IDR: "id-ID"
};

const LANGUAGE_CURRENCY: Partial<Record<SupportedLanguageCode, DisplayCurrencyCode>> = {
  en: "USD",
  "zh-CN": "CNY",
  "zh-TW": "TWD",
  ja: "JPY",
  ko: "KRW",
  th: "THB",
  km: "KHR",
  es: "EUR",
  fr: "EUR",
  vi: "VND",
  ms: "MYR"
};

export function normalizeMoneyLanguage(
  locale?: Locale | SupportedLanguageCode | null
): SupportedLanguageCode {
  if (!locale) return "en";
  if (locale === "zh") return "zh-CN";
  if (locale === "en") return "en";
  return normalizeLanguageCode(locale);
}

export function getDisplayCurrency(
  locale?: Locale | SupportedLanguageCode | null
): DisplayCurrencyCode {
  const language = normalizeMoneyLanguage(locale);
  return LANGUAGE_CURRENCY[language] ?? "USD";
}

export function convertUsdToDisplayAmount(
  amountUsd: number,
  locale?: Locale | SupportedLanguageCode | null
): number {
  const currency = getDisplayCurrency(locale);
  const rate = USD_REFERENCE_RATES[currency];
  const raw = amountUsd * rate;
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.max(0, Math.round(raw));
  }
  return Math.max(0, Math.round(raw));
}

export function formatMoneyFromUsd(
  amountUsd: number,
  locale?: Locale | SupportedLanguageCode | null,
  options?: { fractionDigits?: number; currency?: DisplayCurrencyCode }
): string {
  const currency = options?.currency ?? getDisplayCurrency(locale);
  const converted = convertUsdToDisplayAmount(amountUsd, locale);
  const intlLocale = INTL_LOCALE_BY_CURRENCY[currency];
  const fractionDigits =
    options?.fractionDigits ?? (ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 0);

  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0
  }).format(converted);
}

export function formatMoneyRangeFromUsd(
  minUsd: number,
  maxUsd: number | null,
  locale?: Locale | SupportedLanguageCode | null
): string {
  if (maxUsd === null) {
    return `${formatMoneyFromUsd(minUsd, locale)}+`;
  }
  return `${formatMoneyFromUsd(minUsd, locale)} – ${formatMoneyFromUsd(maxUsd, locale)}`;
}

export function formatStoredBudgetRange(
  stored: string,
  locale?: Locale | SupportedLanguageCode | null
): string {
  const trimmed = stored.trim();
  if (!trimmed) return trimmed;

  const isPlus = /\+$/.test(trimmed);
  const numbers =
    trimmed.match(/\d[\d,]*/g)?.map((item) => Number(item.replace(/,/g, ""))) ?? [];
  if (!numbers.length || numbers.some((item) => !Number.isFinite(item))) {
    return trimmed;
  }

  if (isPlus) {
    return formatMoneyRangeFromUsd(numbers[0], null, locale);
  }
  if (numbers.length >= 2) {
    return formatMoneyRangeFromUsd(numbers[0], numbers[1], locale);
  }
  return formatMoneyFromUsd(numbers[0], locale);
}

export function budgetRangeLabel(locale?: Locale | SupportedLanguageCode | null): string {
  const language = normalizeMoneyLanguage(locale);
  if (language === "zh-CN" || language === "zh-TW") return "预算范围";
  if (language === "ja") return "予算範囲";
  if (language === "ko") return "예산 범위";
  return "Budget range";
}

export function budgetCurrencyHint(locale?: Locale | SupportedLanguageCode | null): string {
  const currency = getDisplayCurrency(locale);
  if (currency === "USD") return "USD";
  if (currency === "CNY") return "人民币";
  if (currency === "TWD") return "新台幣";
  return currency;
}

export function getCurrencySymbol(locale?: Locale | SupportedLanguageCode | null): string {
  const currency = getDisplayCurrency(locale);
  const intlLocale = INTL_LOCALE_BY_CURRENCY[currency];
  const parts = new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol"
  }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? "$";
}

/** Shown when display currency differs from USD settlement. */
export function settlementUsdNote(locale?: Locale | SupportedLanguageCode | null): string | null {
  const currency = getDisplayCurrency(locale);
  if (currency === "USD") return null;
  const language = normalizeMoneyLanguage(locale);
  if (language === "zh-CN" || language === "zh-TW") {
    return "结算与托管仍以美元计价，以上为参考换算";
  }
  return "Settlement remains in USD — amounts shown are reference conversions";
}

export function proUpgradeLabel(locale?: Locale | SupportedLanguageCode | null): string {
  const language = normalizeMoneyLanguage(locale);
  const price = formatMoneyFromUsd(30, locale);
  if (language === "zh-CN" || language === "zh-TW") {
    return `${price}/月升级到 Professional`;
  }
  return `${price}/mo · Upgrade to Professional`;
}
