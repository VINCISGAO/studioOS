import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import type { CreatorProjectFilter } from "@/lib/studioos/creator-order-lifecycle";
import {
  creatorUploadActionLabel,
  isCreatorOrderInProgress,
  isCreatorOrderPendingReview,
  isCreatorUploadActionable,
  matchesCreatorProjectFilter
} from "@/lib/studioos/creator-order-lifecycle";

export type CreatorProjectsStats = {
  inProgress: number;
  pendingReview: number;
  completedThisMonth: number;
  monthlyIncome: number;
  avgDeliveryDays: number;
  inProgressTrend: string;
  pendingTrend: string;
  completedTrend: string;
  incomeTrend: string;
  deliveryTrend: string;
};

export type CreatorProjectTableRow = {
  id: string;
  title: string;
  code: string;
  brand: string;
  status: StoredOrder["status"];
  stageLabel: string;
  currentTask: string;
  deadline: string;
  deadlineHint: string;
  progress: number;
  amount: number;
  latestUpdate: string;
  href: string;
  actionHref: string;
  actionLabel: string;
  actionVariant: "detail" | "upload";
  thumbSeed: string;
};

export function buildCreatorProjectsStats(
  locale: Locale,
  orders: StoredOrder[]
): CreatorProjectsStats {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const inProgress = orders.filter((order) => isCreatorOrderInProgress(order.status)).length;
  const pendingReview = orders.filter((order) => isCreatorOrderPendingReview(order.status)).length;
  const completedThisMonth = orders.filter(
    (order) =>
      order.status === "completed" &&
      order.completed_at &&
      new Date(order.completed_at) >= monthStart
  ).length;
  const monthlyIncome = orders
    .filter(
      (order) =>
        order.status === "completed" &&
        order.completed_at &&
        new Date(order.completed_at) >= monthStart
    )
    .reduce((sum, order) => sum + order.creator_payout, 0);

  if (locale === "zh") {
    return {
      inProgress,
      pendingReview,
      completedThisMonth,
      monthlyIncome,
      avgDeliveryDays: 4.2,
      inProgressTrend: "较上月 ↑ 2",
      pendingTrend: "较上月 ↓ 1",
      completedTrend: "较上月 ↑ 1",
      incomeTrend: "较上月 ↑ 18.6%",
      deliveryTrend: "较上月 ↓ 1.3 天"
    };
  }

  return {
    inProgress,
    pendingReview,
    completedThisMonth,
    monthlyIncome,
    avgDeliveryDays: 4.2,
    inProgressTrend: "vs last month ↑ 2",
    pendingTrend: "vs last month ↓ 1",
    completedTrend: "vs last month ↑ 1",
    incomeTrend: "vs last month ↑ 18.6%",
    deliveryTrend: "vs last month ↓ 1.3d"
  };
}

function projectCode(order: StoredOrder, index: number) {
  const stamp = order.created_at.slice(0, 10).replace(/-/g, "");
  return `#CAM-${stamp}-${String(index + 1).padStart(2, "0")}`;
}

function progressForOrder(order: StoredOrder, deliverableCount: number) {
  if (order.status === "completed") return 100;
  if (order.status === "review") return 80;
  if (order.status === "revision") return 65;
  if (deliverableCount > 0) return Math.min(90, 40 + deliverableCount * 20);
  return 20;
}

function currentTaskForOrder(
  locale: Locale,
  order: StoredOrder,
  deliverableCount: number
) {
  if (order.status === "waiting_payment" || order.payment_status === "unpaid") {
    return locale === "zh" ? "等待品牌付款后开始制作" : "Waiting for brand payment before production";
  }
  if (deliverableCount === 0 && ["paid", "in_production", "review", "revision"].includes(order.status)) {
    return locale === "zh" ? "上传第一版视频" : "Upload version 1 video";
  }
  if (order.status === "review") {
    return locale === "zh" ? "等待品牌审核" : "Waiting for brand review";
  }
  if (order.status === "revision") {
    return locale === "zh" ? "修改第二版" : "Revise version 2";
  }
  if (order.status === "completed") {
    return locale === "zh" ? "项目已完成" : "Project completed";
  }
  if (deliverableCount === 0) {
    return locale === "zh" ? "上传第一版 0/3 已完成" : "Upload v1 · 0/3 done";
  }
  return locale === "zh"
    ? `上传第一版 ${Math.min(deliverableCount, 3)}/3 已完成`
    : `Upload v1 · ${Math.min(deliverableCount, 3)}/3 done`;
}

function latestUpdateForOrder(locale: Locale, order: StoredOrder) {
  if (order.status === "review" || order.status === "revision") {
    return locale === "zh" ? "品牌 2 小时前 回复了评论" : "Brand replied 2h ago";
  }
  if (order.status === "completed") {
    return locale === "zh" ? "项目已于昨天完成交付" : "Delivered yesterday";
  }
  return locale === "zh" ? "你 1 小时前 上传了新版本" : "You uploaded 1h ago";
}

function deadlineHint(locale: Locale, iso: string) {
  const diffDays = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (diffDays <= 0) {
    return locale === "zh" ? "今天截止" : "Due today";
  }
  return locale === "zh" ? `剩余 ${diffDays} 天` : `${diffDays}d left`;
}

export function buildCreatorProjectRows(input: {
  locale: Locale;
  orders: StoredOrder[];
  deliverableCounts: Record<string, number>;
  filter: CreatorProjectFilter;
}): CreatorProjectTableRow[] {
  const stageLabels =
    input.locale === "zh"
      ? {
          in_production: "制作中",
          review: "待审核",
          revision: "修改中",
          completed: "已完成",
          waiting_payment: "待开始",
          paid: "已付款",
          ready_for_completion: "待确认完成",
          settling: "结算中",
          dispute: "争议中",
          cancelled: "已关闭"
        } satisfies Record<StoredOrder["status"], string>
      : {
          in_production: "In production",
          review: "Pending review",
          revision: "Revising",
          completed: "Completed",
          waiting_payment: "Pending",
          paid: "Paid",
          ready_for_completion: "Ready to complete",
          settling: "Settling",
          dispute: "Dispute",
          cancelled: "Closed"
        } satisfies Record<StoredOrder["status"], string>;

  return input.orders
    .filter((order) => matchesCreatorProjectFilter(order, input.filter))
    .map((order, index) => {
      const deliverableCount = input.deliverableCounts[order.id] ?? 0;
      const deadline = order.completed_at ?? order.paid_at ?? order.created_at;
      const uploadActionable = isCreatorUploadActionable(order, deliverableCount);
      return {
        id: order.id,
        title: order.title || order.company_name,
        code: projectCode(order, index),
        brand: order.company_name || order.client_name,
        status: order.status,
        stageLabel: stageLabels[order.status] ?? order.status,
        currentTask: currentTaskForOrder(input.locale, order, deliverableCount),
        deadline,
        deadlineHint: deadlineHint(input.locale, deadline),
        progress: progressForOrder(order, deliverableCount),
        amount: order.creator_payout,
        latestUpdate: latestUpdateForOrder(input.locale, order),
        href: creatorPortalRoutes.project(order.id),
        actionHref: uploadActionable
          ? creatorPortalRoutes.review(order.id)
          : creatorPortalRoutes.project(order.id),
        actionLabel: uploadActionable
          ? creatorUploadActionLabel(input.locale, order.status)
          : input.locale === "zh"
            ? "查看详情"
            : "View details",
        actionVariant: uploadActionable ? "upload" : "detail",
        thumbSeed: order.company_name || order.title
      };
    });
}
