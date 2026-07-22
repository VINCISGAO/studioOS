import type { CreditTransactionView } from "@/features/credit-wallet/credit-wallet.types";
import type { Locale } from "@/lib/i18n";

export type CreditTransactionIconKind =
  | "purchase"
  | "bonus"
  | "convert"
  | "generate"
  | "refund"
  | "frozen"
  | "release"
  | "admin"
  | "default";

const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  PURCHASE: { zh: "PURCHASE", en: "PURCHASE" },
  BONUS: { zh: "BONUS", en: "BONUS" },
  EARNING_CONVERSION: { zh: "EARNING_CONVERSION", en: "EARNING_CONVERSION" },
  CAPTURE: { zh: "CAPTURE", en: "CAPTURE" },
  RESERVE: { zh: "RESERVE", en: "RESERVE" },
  RELEASE: { zh: "RELEASE", en: "RELEASE" },
  REFUND: { zh: "REFUND", en: "REFUND" },
  ADMIN_ADJUSTMENT: { zh: "ADMIN_ADJUSTMENT", en: "ADMIN_ADJUSTMENT" },
  EXPIRATION: { zh: "EXPIRATION", en: "EXPIRATION" }
};

const SOURCE_LABELS: Record<string, { zh: string; en: string }> = {
  CASH_PAYMENT: { zh: "CASH_PAYMENT", en: "CASH_PAYMENT" },
  CREATOR_EARNINGS: { zh: "CREATOR_EARNINGS", en: "CREATOR_EARNINGS" },
  PROMOTION: { zh: "PROMOTION", en: "PROMOTION" },
  SYSTEM: { zh: "SYSTEM", en: "SYSTEM" },
  ADMIN: { zh: "ADMIN", en: "ADMIN" },
  GENERATION_JOB: { zh: "GENERATION_JOB", en: "GENERATION_JOB" }
};

export function creditTransactionIconKind(row: CreditTransactionView): CreditTransactionIconKind {
  switch (row.type) {
    case "PURCHASE":
      return "purchase";
    case "BONUS":
      return "bonus";
    case "EARNING_CONVERSION":
      return "convert";
    case "CAPTURE":
      return "generate";
    case "REFUND":
      return "refund";
    case "RESERVE":
      return "frozen";
    case "RELEASE":
      return "release";
    case "ADMIN_ADJUSTMENT":
      return "admin";
    default:
      return "default";
  }
}

export function creditTransactionTitle(row: CreditTransactionView, locale: Locale): string {
  const desc = row.description?.trim();
  if (desc) return desc;
  const labels = TYPE_LABELS[row.type];
  if (labels) return locale === "zh" ? labels.zh : labels.en;
  return row.type;
}

export function creditTransactionSubtitle(row: CreditTransactionView, locale: Locale): string | null {
  const labels = SOURCE_LABELS[row.source];
  if (!labels) return null;
  return locale === "zh" ? labels.zh : labels.en;
}

export function formatTransactionTimestamp(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

export function creditTransactionAmountLabel(row: CreditTransactionView): string {
  const prefix = row.amount >= 0 ? "+" : "";
  return `${prefix}${row.amount.toLocaleString()} Token`;
}

export function filterTransactionsByType(
  rows: CreditTransactionView[],
  typeFilter: string
): CreditTransactionView[] {
  if (typeFilter === "ALL") return rows;
  return rows.filter((row) => row.type === typeFilter);
}

export function filterTransactionsByDays(rows: CreditTransactionView[], days: number): CreditTransactionView[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return rows.filter((row) => new Date(row.createdAt).getTime() >= cutoff);
}
