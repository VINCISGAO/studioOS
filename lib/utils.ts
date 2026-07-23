import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Locale } from "@/lib/i18n";
import type { SupportedLanguageCode } from "@/features/i18n/language.constants";
import { formatMoneyFromUsd, formatSettlementUsd } from "@/lib/money/display-money";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  locale?: Locale | SupportedLanguageCode
) {
  return formatMoneyFromUsd(amount, locale ?? "en");
}

export { formatSettlementUsd };

export function formatDate(date: string, locale?: Locale) {
  const intlLocale = locale === "zh" ? "zh-CN" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}
