import {
  approveOrderDelivery,
  getOrder,
  requestOrderRevision
} from "@/lib/order-service";
import { syncProjectAfterDeliverable } from "@/lib/studioos/project-order-sync";
import type { ReviewSessionStatus } from "@/lib/review-engine/types";

/** Map review session status → VINCIS order status side effects. */
export async function syncOrderFromReviewSession(
  orderId: string,
  sessionStatus: ReviewSessionStatus,
  projectId?: string | null
) {
  const order = await getOrder(orderId);
  if (!order) {
    return;
  }

  const resolvedProjectId = projectId ?? order.project_id;

  switch (sessionStatus) {
    case "ready_for_review":
      await syncProjectAfterDeliverable(resolvedProjectId);
      break;
    case "changes_requested":
      if (order.status === "review") {
        await requestOrderRevision(orderId, "Changes requested via Frame.io review");
      }
      break;
    case "approved":
      if (["review", "revision"].includes(order.status)) {
        await approveOrderDelivery(orderId);
      }
      break;
    default:
      break;
  }
}
