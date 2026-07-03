import type { Locale } from "@/lib/i18n";

export type ReviewSettlementPreview = {
  version: number;
  orderAmount: number;
  paidRevisionAddOnAmount?: number;
  platformFee: number;
  creatorPayout: number;
  currency: string;
  settlementStatus: "pending" | "ready" | "released" | "completed" | "blocked";
};

export function formatReviewMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat(currency === "CNY" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: currency === "CNY" ? "CNY" : "USD",
    maximumFractionDigits: 2
  }).format(amount);
}

export function reviewSettlementStatusLabel(
  locale: Locale,
  status: ReviewSettlementPreview["settlementStatus"]
) {
  if (locale === "zh") {
    if (status === "pending") return "待释放";
    if (status === "ready") return "可释放";
    if (status === "released") return "已释放";
    if (status === "completed") return "已完成";
    return "暂不可结款";
  }
  if (status === "pending") return "Pending release";
  if (status === "ready") return "Ready to release";
  if (status === "released") return "Released";
  if (status === "completed") return "Completed";
  return "Blocked";
}
