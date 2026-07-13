import type { StoredOrder } from "@/lib/order-types";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

/** Brand may abandon wizard drafts and unpaid checkout — not active production. */
export function canDeleteProject(status: string) {
  const normalized = normalizeCampaignStatus(status);
  return (
    normalized === "draft" ||
    normalized === "payment_pending" ||
    normalized === "completed" ||
    normalized === "cancelled"
  );
}

export function canDeleteOrder(order: Pick<StoredOrder, "status" | "payment_status">) {
  if (order.status === "completed" || order.status === "cancelled") {
    return true;
  }
  return order.status === "waiting_payment" && order.payment_status === "unpaid";
}
