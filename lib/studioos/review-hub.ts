import type { StoredOrder } from "@/lib/order-types";
import { getDeliverables, listOrdersForClient, listOrdersForCreator } from "@/lib/order-service";
import { getProject } from "@/lib/project-service";
import { listReviewComments } from "@/lib/studioos/review-store";

export type ReviewHubItem = {
  orderId: string;
  projectId: string | null;
  title: string;
  brandName: string;
  description: string;
  status: StoredOrder["status"];
  updatedAt: string;
  deliverableCount: number;
  openCommentCount: number;
  reviewHref: string;
  latestVersion: number | null;
  latestVersionUploadedAt: string | null;
  latestCommentAt: string | null;
  deadline: string | null;
  budget: number;
};

const REVIEW_ORDER_STATUSES = new Set<StoredOrder["status"]>([
  "in_production",
  "review",
  "revision",
  "completed"
]);

function isReviewQueueOrder(order: StoredOrder) {
  return REVIEW_ORDER_STATUSES.has(order.status);
}

async function toReviewHubItem(
  order: StoredOrder,
  reviewHref: string,
  options?: { includeAwaitingFirstUpload?: boolean }
): Promise<ReviewHubItem | null> {
  const [deliverables, comments] = await Promise.all([
    getDeliverables(order.id),
    listReviewComments(order.id)
  ]);

  if (
    !deliverables.length &&
    order.status === "in_production" &&
    !options?.includeAwaitingFirstUpload
  ) {
    return null;
  }

  if (!deliverables.length && !["review", "revision", "completed"].includes(order.status)) {
    return null;
  }

  let title = order.title || order.company_name;
  let brandName = order.company_name || order.client_name;
  let description = order.requirements ?? "";
  let projectDeadline: string | null = null;
  if (order.project_id) {
    const project = await getProject(order.project_id);
    if (project) {
      title = project.title || project.product_name || project.company_name || title;
      brandName = project.company_name || project.client_name || brandName;
      description = project.campaign_goal || project.notes || description;
      projectDeadline = project.deadline ?? null;
    }
  }

  const latestDeliverable = deliverables.sort((a, b) => b.version - a.version)[0];
  const latestComment = comments
    .filter((item) => item.status === "open")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return {
    orderId: order.id,
    projectId: order.project_id,
    title,
    brandName,
    description,
    status: order.status,
    updatedAt: order.completed_at ?? order.paid_at ?? order.created_at,
    deliverableCount: deliverables.length,
    openCommentCount: comments.filter((item) => item.status === "open").length,
    reviewHref,
    latestVersion: latestDeliverable?.version ?? null,
    latestVersionUploadedAt: latestDeliverable?.created_at ?? null,
    latestCommentAt: latestComment?.created_at ?? null,
    deadline: projectDeadline,
    budget: order.creator_payout
  };
}

export async function listBrandReviewHubItems(clientEmail: string): Promise<ReviewHubItem[]> {
  const orders = await listOrdersForClient(clientEmail.toLowerCase());
  const items = await Promise.all(
    orders
      .filter(isReviewQueueOrder)
      .map((order) =>
        toReviewHubItem(
          order,
          order.project_id
            ? `/brand/projects/${order.project_id}/review`
            : `/brand/orders/${order.id}/review`
        )
      )
  );
  return items
    .filter((item): item is ReviewHubItem => item != null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function listCreatorReviewHubItems(creatorId: string): Promise<ReviewHubItem[]> {
  const orders = await listOrdersForCreator(creatorId);
  const items = await Promise.all(
    orders
      .filter(isReviewQueueOrder)
      .map((order) => toReviewHubItem(order, `/studio/review/${order.id}`, { includeAwaitingFirstUpload: true }))
  );
  return items
    .filter((item): item is ReviewHubItem => item != null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
