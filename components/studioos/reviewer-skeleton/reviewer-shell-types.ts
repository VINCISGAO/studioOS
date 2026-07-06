import type { Locale } from "@/lib/i18n";

export type ReviewerShellHeaderInfo = {
  campaignTitle: string;
  orderId: string;
  createdAtLabel?: string;
  statusLabel: string;
};

export function reviewStatusLabel(locale: Locale, status: string) {
  if (locale === "zh") {
    if (status === "waiting_payment") return "待付款";
    if (status === "paid") return "已付款";
    if (status === "in_production") return "制作中";
    if (status === "review") return "审片中";
    if (status === "revision") return "修改中";
    if (status === "ready_for_completion") return "等待最终确认";
    if (status === "settling") return "结算中";
    if (status === "completed") return "项目完成";
    if (status === "dispute") return "平台介入";
    return "待审片";
  }
  if (status === "waiting_payment") return "Awaiting payment";
  if (status === "paid") return "Paid";
  if (status === "in_production") return "Producing";
  if (status === "review") return "Under review";
  if (status === "revision") return "Revision";
  if (status === "ready_for_completion") return "Awaiting final confirmation";
  if (status === "settling") return "Settling";
  if (status === "completed") return "Completed";
  if (status === "dispute") return "Dispute";
  return "In review";
}
