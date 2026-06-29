import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n";
import type { CampaignProjectStatus } from "@/lib/studioos/project-status";
import type { ProjectStatus } from "@/lib/types";
import type { OrderStatus } from "@/lib/order-types";
import { projectStatusLabel } from "@/lib/mvp/review-settlement";
import type { ProjectStatus as MvpProjectStatus } from "@/lib/mvp/types";

const mvpStatuses = new Set<string>([
  "draft",
  "in_review",
  "revision",
  "pending_settlement",
  "settled",
  "approved",
  "delivered"
]);

const legacyLabels: Record<Locale, Record<ProjectStatus, string>> = {
  en: {
    submitted: "Submitted",
    approved: "Approved",
    waiting_payment: "Waiting payment",
    paid: "Paid",
    matching: "Matching",
    assigned: "Assigned",
    matched: "Matched",
    in_production: "In production",
    review: "Review",
    revision: "Revision",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    disputed: "Disputed",
    refunded: "Refunded"
  },
  zh: {
    submitted: "已提交",
    approved: "已审核",
    waiting_payment: "待付款",
    paid: "已付款",
    matching: "匹配中",
    assigned: "已分配",
    matched: "已匹配",
    in_production: "制作中",
    review: "待审核",
    revision: "修改中",
    delivered: "已交付",
    completed: "已完成",
    cancelled: "已取消",
    disputed: "争议中",
    refunded: "已退款"
  }
};

const campaignLabels: Record<Locale, Record<CampaignProjectStatus, string>> = {
  en: {
    draft: "Draft",
    matching: "Matching",
    studio_selected: "Studio selected",
    proposal: "Proposal",
    contract_pending: "Contract",
    payment_pending: "Awaiting payment",
    production: "In production",
    in_review: "In review",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    disputed: "Disputed"
  },
  zh: {
    draft: "草稿",
    matching: "匹配中",
    studio_selected: "已选 Studio",
    proposal: "Proposal Room",
    contract_pending: "待签约",
    payment_pending: "待付款",
    production: "制作中",
    in_review: "审片中",
    delivered: "已交付",
    completed: "已完成",
    cancelled: "已取消",
    disputed: "争议中"
  }
};

function resolveLabel(status: string, locale: Locale): string {
  if (mvpStatuses.has(status)) {
    return projectStatusLabel(status as MvpProjectStatus, locale);
  }
  if (status in campaignLabels[locale]) {
    return campaignLabels[locale][status as CampaignProjectStatus];
  }
  if (status in legacyLabels[locale]) {
    return legacyLabels[locale][status as ProjectStatus];
  }
  return status;
}

export function StatusBadge({
  status,
  locale = "en"
}: {
  status: ProjectStatus | OrderStatus | CampaignProjectStatus | string;
  locale?: Locale;
}) {
  const variant = ["delivered", "completed", "paid", "approved", "assigned", "matched", "settled"].includes(status)
    ? "success"
    : [
          "review",
          "revision",
          "matching",
          "waiting_payment",
          "in_production",
          "production",
          "in_review",
          "pending_settlement",
          "disputed",
          "proposal",
          "contract_pending",
          "payment_pending"
        ].includes(status)
      ? "warning"
      : status === "draft"
        ? "secondary"
        : "secondary";

  return <Badge variant={variant}>{resolveLabel(status, locale)}</Badge>;
}
