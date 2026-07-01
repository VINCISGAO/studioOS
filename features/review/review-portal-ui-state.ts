import { campaignRepository } from "@/features/campaign/campaign.repository";
import { CampaignState } from "@/features/campaign/campaign.state-machine";
import { deliveryRepository } from "@/features/delivery/delivery.repository";
import { paymentRepository } from "@/features/payment/payment.repository";
import { versionRepository } from "@/features/delivery/version.repository";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { OrderStatus, StoredOrder } from "@/lib/order-types";
import { reviewCenterActiveStepIndex } from "@/lib/studioos/review-center-workflow";

export type ReviewPortalUiState = {
  source: "prisma" | "legacy";
  derivedOrderStatus: OrderStatus;
  canBrandReview: boolean;
  canCreatorUpload: boolean;
  orderApproved: boolean;
  canDecide: boolean;
  canReleaseSettlement: boolean;
  workflowStepIndex: number;
  workspaceStatus: "completed" | "revision" | "in_production" | "review";
  escrowFunded: boolean;
  deliverableCount: number;
};

const UPLOADABLE_CAMPAIGN_STATUSES = new Set<string>([
  CampaignState.PRODUCING,
  CampaignState.UNDER_REVIEW
]);

const APPROVED_CAMPAIGN_STATUSES = new Set<string>([
  CampaignState.APPROVED,
  CampaignState.MASTER_UPLOADED,
  CampaignState.SETTLEMENT,
  CampaignState.COMPLETED
]);

function deriveOrderStatusFromCampaign(input: {
  campaignStatus: string;
  latestReviewStatus: string | null;
  deliverableCount: number;
  deliveryLocked: boolean;
  escrowReleased: boolean;
}): OrderStatus {
  const { campaignStatus, latestReviewStatus, deliverableCount, deliveryLocked, escrowReleased } =
    input;

  if (campaignStatus === CampaignState.COMPLETED || escrowReleased) {
    return "completed";
  }

  if (APPROVED_CAMPAIGN_STATUSES.has(campaignStatus) || deliveryLocked) {
    return "completed";
  }

  if (
    latestReviewStatus === "REVISION_REQUIRED" ||
    (campaignStatus === CampaignState.PRODUCING && deliverableCount > 0 && latestReviewStatus !== "REVIEWING" && latestReviewStatus !== "READY")
  ) {
    return "revision";
  }

  if (
    campaignStatus === CampaignState.UNDER_REVIEW ||
    latestReviewStatus === "REVIEWING" ||
    latestReviewStatus === "READY" ||
    (deliverableCount > 0 && campaignStatus === CampaignState.PRODUCING)
  ) {
    return "review";
  }

  if (
    campaignStatus === CampaignState.PRODUCING ||
    campaignStatus === CampaignState.ESCROW_FUNDED
  ) {
    return "in_production";
  }

  if (
    [
      CampaignState.CREATOR_ACCEPTED,
      CampaignState.ESCROW_PENDING,
      CampaignState.MATCHING,
      CampaignState.INVITATION_SENT
    ].includes(campaignStatus as typeof CampaignState.CREATOR_ACCEPTED)
  ) {
    return "waiting_payment";
  }

  return "waiting_payment";
}

function workspaceStatusFromOrderStatus(
  status: OrderStatus
): ReviewPortalUiState["workspaceStatus"] {
  if (status === "completed") return "completed";
  if (status === "revision") return "revision";
  if (status === "in_production") return "in_production";
  return "review";
}

function legacyFallback(order: StoredOrder, deliverableCount: number): ReviewPortalUiState {
  const derivedOrderStatus = order.status;
  return {
    source: "legacy",
    derivedOrderStatus,
    canBrandReview: ["review", "revision"].includes(derivedOrderStatus),
    canCreatorUpload: ["in_production", "revision", "review"].includes(derivedOrderStatus),
    orderApproved: derivedOrderStatus === "completed",
    canDecide:
      (derivedOrderStatus === "review" || derivedOrderStatus === "revision") &&
      deliverableCount > 0,
    canReleaseSettlement: false,
    workflowStepIndex: reviewCenterActiveStepIndex(order, deliverableCount),
    workspaceStatus: workspaceStatusFromOrderStatus(derivedOrderStatus),
    escrowFunded: order.payment_status !== "unpaid",
    deliverableCount
  };
}

export async function resolveReviewPortalUiState(input: {
  legacyProjectId: string;
  order: StoredOrder;
  deliverableCount: number;
}): Promise<ReviewPortalUiState> {
  if (!hasDatabaseUrl()) {
    return legacyFallback(input.order, input.deliverableCount);
  }

  const campaign = await campaignRepository.findByLegacyProjectId(input.legacyProjectId);
  if (!campaign) {
    return legacyFallback(input.order, input.deliverableCount);
  }

  const [versions, delivery, escrow] = await Promise.all([
    versionRepository.listByCampaign(campaign.id),
    deliveryRepository.findByCampaignIdWithVersion(campaign.id),
    paymentRepository.findByCampaignId(campaign.id)
  ]);

  const deliverableCount = Math.max(input.deliverableCount, versions.length);
  const latestVersion = versions[versions.length - 1] ?? null;
  const latestReviewStatus = latestVersion?.reviewStatus ?? null;
  const deliveryLocked = delivery?.status === "LOCKED";
  const escrowFunded =
    escrow?.status === EscrowState.HELD ||
    escrow?.status === EscrowState.PARTIAL_RELEASE ||
    escrow?.status === EscrowState.FULL_RELEASE;
  const escrowReleased =
    escrow?.status === EscrowState.FULL_RELEASE || escrow?.status === EscrowState.CLOSED;

  const derivedOrderStatus = deriveOrderStatusFromCampaign({
    campaignStatus: campaign.status,
    latestReviewStatus,
    deliverableCount,
    deliveryLocked,
    escrowReleased
  });

  const orderApproved =
    APPROVED_CAMPAIGN_STATUSES.has(campaign.status) || derivedOrderStatus === "completed";
  const canBrandReview =
    campaign.status === CampaignState.UNDER_REVIEW ||
    latestReviewStatus === "REVIEWING" ||
    latestReviewStatus === "READY" ||
    derivedOrderStatus === "review" ||
    derivedOrderStatus === "revision";
  const canCreatorUpload = UPLOADABLE_CAMPAIGN_STATUSES.has(campaign.status);
  const canDecide = canBrandReview && deliverableCount > 0;
  const canReleaseSettlement =
    orderApproved &&
    deliveryLocked &&
    escrowFunded &&
    escrow?.status === EscrowState.HELD &&
    (campaign.status === CampaignState.APPROVED ||
      campaign.status === CampaignState.MASTER_UPLOADED);

  const pseudoOrder: StoredOrder = { ...input.order, status: derivedOrderStatus };

  return {
    source: "prisma",
    derivedOrderStatus,
    canBrandReview,
    canCreatorUpload,
    orderApproved,
    canDecide,
    canReleaseSettlement,
    workflowStepIndex: reviewCenterActiveStepIndex(pseudoOrder, deliverableCount),
    workspaceStatus: workspaceStatusFromOrderStatus(derivedOrderStatus),
    escrowFunded,
    deliverableCount
  };
}

export function reviewCenterActiveStepFromUiState(
  ui: ReviewPortalUiState,
  order: StoredOrder
): number {
  const pseudoOrder: StoredOrder = { ...order, status: ui.derivedOrderStatus };
  return reviewCenterActiveStepIndex(pseudoOrder, ui.deliverableCount);
}
