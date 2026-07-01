import type { StoredOrder } from "@/lib/order-types";

export const reviewCenterWorkflowSteps = {
  en: [
    "Recruited",
    "Accepted",
    "In production",
    "Pending review",
    "Pending revision",
    "Pending delivery",
    "Pending settlement",
    "Completed"
  ],
  zh: ["招募完成", "已接受", "制作中", "待审核", "待修改", "待交付", "待结算", "已完成"]
} as const;

export function reviewCenterActiveStepIndex(order: StoredOrder, deliverableCount: number): number {
  if (order.status === "completed") return 7;
  if (order.status === "revision") return 4;
  if (order.status === "review") return 3;
  if (deliverableCount > 0) return 3;
  if (order.status === "in_production") return 2;
  return 1;
}
