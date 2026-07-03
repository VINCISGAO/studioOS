import type { StoredOrder } from "@/lib/order-types";

/** Creator project list tabs under 我的项目 */
export type CreatorProjectFilter = "in_progress" | "pending_review" | "completed" | "history";

export const creatorProjectFilters: CreatorProjectFilter[] = [
  "in_progress",
  "pending_review",
  "completed",
  "history"
];

export const creatorProjectFilterLabels = {
  en: {
    in_progress: "In progress",
    pending_review: "Pending review",
    completed: "Completed",
    history: "Past projects"
  },
  zh: {
    in_progress: "进行中",
    pending_review: "待审核",
    completed: "已完成",
    history: "历史项目"
  }
} as const;

export type CreatorTodayTask =
  | "accept_invitation"
  | "wait_brand_selection"
  | "upload_work"
  | "brand_review"
  | "collect_payment";

export const creatorTodayTaskLabels = {
  en: {
    accept_invitation: "Waiting to accept invitations",
    wait_brand_selection: "Waiting for brand selection",
    upload_work: "Waiting to upload deliverables",
    brand_review: "Waiting for brand review",
    collect_payment: "Waiting to collect payment"
  },
  zh: {
    accept_invitation: "等待接受邀请",
    wait_brand_selection: "等待品牌选定",
    upload_work: "等待上传作品",
    brand_review: "等待品牌审核",
    collect_payment: "等待收款"
  }
} as const;

/** Active creator work — not completed or cancelled (includes brand review). */
export function isCreatorOrderInProgress(status: StoredOrder["status"]): boolean {
  return status !== "completed" && status !== "cancelled";
}

export function isCreatorOrderPendingReview(status: StoredOrder["status"]): boolean {
  return status === "review";
}

export function matchesCreatorProjectFilter(
  order: StoredOrder,
  filter: CreatorProjectFilter
): boolean {
  switch (filter) {
    case "in_progress":
      return isCreatorOrderInProgress(order.status);
    case "pending_review":
      return isCreatorOrderPendingReview(order.status);
    case "completed":
      return order.status === "completed";
    case "history":
      return order.status === "cancelled";
  }
}

/** @deprecated Prefer matchesCreatorProjectFilter — buckets can overlap (review is both in-progress and pending review). */
export function creatorProjectBucket(status: StoredOrder["status"]): CreatorProjectFilter {
  if (status === "completed") return "completed";
  if (status === "cancelled") return "history";
  if (status === "review") return "pending_review";
  return "in_progress";
}

export function filterCreatorOrders(rows: StoredOrder[], filter: CreatorProjectFilter): StoredOrder[] {
  return rows.filter((order) => matchesCreatorProjectFilter(order, filter));
}

export function countCreatorOrdersByBucket(orders: StoredOrder[]): Record<CreatorProjectFilter, number> {
  const counts: Record<CreatorProjectFilter, number> = {
    in_progress: 0,
    pending_review: 0,
    completed: 0,
    history: 0
  };
  for (const order of orders) {
    for (const filter of creatorProjectFilters) {
      if (matchesCreatorProjectFilter(order, filter)) {
        counts[filter] += 1;
      }
    }
  }
  return counts;
}

export function deriveCreatorTodayTasks(input: {
  pendingInvitations: number;
  awaitingBrandSelection: number;
  orders: StoredOrder[];
  deliverableCounts: Record<string, number>;
}): CreatorTodayTask[] {
  const tasks: CreatorTodayTask[] = [];

  if (input.pendingInvitations > 0) {
    tasks.push("accept_invitation");
  }

  if (input.awaitingBrandSelection > 0) {
    tasks.push("wait_brand_selection");
  }

  const needsUpload = input.orders.some(
    (order) =>
      ["in_production", "revision"].includes(order.status) &&
      order.payment_status !== "unpaid" &&
      order.status !== "waiting_payment" &&
      (input.deliverableCounts[order.id] ?? 0) === 0
  );
  if (needsUpload) {
    tasks.push("upload_work");
  }

  if (input.orders.some((order) => order.status === "review")) {
    tasks.push("brand_review");
  }

  if (
    input.orders.some(
      (order) =>
        order.status === "completed" &&
        order.payout_status !== "paid" &&
        order.payout_status !== "approved"
    )
  ) {
    tasks.push("collect_payment");
  }

  return tasks;
}
