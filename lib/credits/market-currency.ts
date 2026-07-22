import type { Locale } from "@/lib/i18n";
import {
  defaultCurrencyForRegion,
  type SupportedPackageRegion
} from "@/lib/credits/regional-package.constants";
import { formatAmountMinor } from "@/lib/credits/currency-minor-units";

/** Display-only USD→CNY rate for creator earnings settled in USD. */
export const USD_CNY_DISPLAY_RATE = 7.25;

export function uiLocaleToPackageRegion(uiLocale: Locale | null | undefined): SupportedPackageRegion | null {
  if (uiLocale === "zh") return "CN";
  return null;
}

export function intlLocaleForCurrency(currency: string, uiLocale?: Locale | null): string {
  const code = currency.trim().toUpperCase();
  if (code === "CNY") return "zh-CN";
  if (code === "JPY") return "ja-JP";
  if (code === "KRW") return "ko-KR";
  if (code === "EUR") return uiLocale === "zh" ? "zh-CN" : "de-DE";
  if (code === "GBP") return "en-GB";
  return uiLocale === "zh" ? "zh-CN" : "en-US";
}

export function formatMarketAmount(
  currency: string,
  amountMinor: number,
  uiLocale?: Locale | null
): string {
  return formatAmountMinor(currency, amountMinor, intlLocaleForCurrency(currency, uiLocale));
}

export function marketCurrencyForRegion(region: SupportedPackageRegion): string {
  return defaultCurrencyForRegion(region);
}

export function usdMinorToCnyMinor(usdMinor: number): number {
  return Math.round((usdMinor / 100) * USD_CNY_DISPLAY_RATE * 100);
}

export function cnyMinorToUsdMinor(cnyMinor: number): number {
  return Math.round((cnyMinor / 100 / USD_CNY_DISPLAY_RATE) * 100);
}

export function earningDisplayFromUsdMinor(
  usdMinor: number,
  marketCurrency: string
): { amountMinor: number; currency: string } {
  if (marketCurrency === "CNY") {
    return { amountMinor: usdMinorToCnyMinor(usdMinor), currency: "CNY" };
  }
  return { amountMinor: usdMinor, currency: "USD" };
}

export function earningInputToUsdMinor(inputMinor: number, marketCurrency: string): number {
  if (marketCurrency === "CNY") {
    return cnyMinorToUsdMinor(inputMinor);
  }
  return inputMinor;
}

export function marketCurrencyForUiLocale(uiLocale?: Locale | null): string {
  return uiLocale === "zh" ? "CNY" : "USD";
}

export function currencySymbol(currency: string): string {
  const code = currency.trim().toUpperCase();
  if (code === "CNY") return "¥";
  if (code === "USD") return "$";
  if (code === "EUR") return "€";
  if (code === "GBP") return "£";
  if (code === "JPY") return "¥";
  if (code === "KRW") return "₩";
  return code;
}

export function currencyUnitLabel(currency: string, uiLocale: Locale): string {
  const code = currency.trim().toUpperCase();
  if (uiLocale === "zh") {
    if (code === "CNY") return "人民币";
    if (code === "USD") return "美元";
    if (code === "EUR") return "欧元";
    if (code === "GBP") return "英镑";
    if (code === "JPY") return "日元";
    if (code === "KRW") return "韩元";
  }
  return code;
}
