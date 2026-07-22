const ZERO_DECIMAL_CURRENCIES = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

const INTL_LOCALE_BY_CURRENCY: Record<string, string> = {
  USD: "en-US",
  CNY: "zh-CN",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  KRW: "ko-KR"
};

export function normalizeCurrencyCode(currency: string): string {
  return currency.trim().toUpperCase();
}

export function isZeroDecimalCurrency(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.has(normalizeCurrencyCode(currency));
}

export function validateAmountMinor(currency: string, amountMinor: number): void {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error("Amount must be a positive integer in the currency minor unit");
  }
  if (isZeroDecimalCurrency(currency) && amountMinor < 1) {
    throw new Error("Zero-decimal currencies must use whole currency units");
  }
  if (!isZeroDecimalCurrency(currency) && amountMinor < 50) {
    throw new Error("Amount is below the minimum charge threshold");
  }
}

export function stripeUnitAmount(currency: string, amountMinor: number): number {
  validateAmountMinor(currency, amountMinor);
  return amountMinor;
}

export function formatAmountMinor(
  currency: string,
  amountMinor: number,
  locale = "en-US"
): string {
  const normalized = normalizeCurrencyCode(currency);
  const intlLocale = INTL_LOCALE_BY_CURRENCY[normalized] ?? locale;
  const divisor = isZeroDecimalCurrency(normalized) ? 1 : 100;
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: normalized,
    minimumFractionDigits: isZeroDecimalCurrency(normalized) ? 0 : 2,
    maximumFractionDigits: isZeroDecimalCurrency(normalized) ? 0 : 2
  }).format(amountMinor / divisor);
}
