import "server-only";

import { getCurrentCreatorId, getCurrentSession } from "@/features/auth/session-context";
import { getInquiry } from "@/lib/chat-service";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getOrder } from "@/lib/order-service";

export { resolveStaticLegacyRedirect, STATIC_LEGACY_REDIRECTS } from "@/lib/studioos/legacy-route-redirect.shared";

const REVIEW_FORWARD_STATUSES = new Set([
  "review",
  "revision",
  "ready_for_completion",
  "completed",
  "settling"
]);

export type LegacyOrderRedirect =
  | { kind: "destination"; path: string }
  | { kind: "login"; nextPath: string };

/**
 * Legacy `/orders/[id]` and `/dashboard/orders/[id]` — resolve by session + order ownership.
 */
export async function resolveLegacyOrderRedirectPath(orderId: string): Promise<LegacyOrderRedirect> {
  const order = await getOrder(orderId);
  if (!order) {
    return { kind: "destination", path: "/brand" };
  }

  const [session, clientEmail, creatorId] = await Promise.all([
    getCurrentSession(),
    getCurrentClientEmail(),
    getCurrentCreatorId()
  ]);

  const normalizedClient = clientEmail?.toLowerCase() ?? "";
  const orderClient = order.client_email.toLowerCase();
  const isBrandViewer =
    session?.role === "client" || (normalizedClient.length > 0 && orderClient === normalizedClient);
  const isCreatorViewer =
    session?.role === "creator" || (creatorId !== null && order.creator_id === creatorId);

  if (isCreatorViewer && !isBrandViewer) {
    const path = REVIEW_FORWARD_STATUSES.has(order.status)
      ? `/studio/review/${orderId}`
      : `/studio/projects/${orderId}`;
    return { kind: "destination", path };
  }

  if (isBrandViewer) {
    const path = order.project_id
      ? `/brand/projects/${order.project_id}/review`
      : `/brand/orders/${orderId}/review`;
    return { kind: "destination", path };
  }

  if (!session) {
    return { kind: "login", nextPath: `/orders/${orderId}` };
  }

  const path = order.project_id
    ? `/brand/projects/${order.project_id}/review`
    : `/brand/orders/${orderId}/review`;
  return { kind: "destination", path };
}

/** Legacy `/proposal/[id]` — inquiry thread maps to brand communication when project-bound. */
export async function resolveLegacyProposalRedirectPath(inquiryId: string): Promise<string | null> {
  const inquiry = await getInquiry(inquiryId);
  if (!inquiry?.project_id) return null;
  return `/brand/projects/${inquiry.project_id}/communication`;
}
