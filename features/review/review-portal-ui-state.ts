import { campaignRepository } from "@/features/campaign/campaign.repository";
import { CampaignState } from "@/features/campaign/campaign.state-machine";
import { deliveryRepository } from "@/features/delivery/delivery.repository";
import { paymentRepository } from "@/features/payment/payment.repository";
import { versionRepository } from "@/features/delivery/version.repository";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { OrderStatus, StoredOrder } from "@/lib/order-types";
import { nextPaidVersionToUnlock } from "@/features/review/review-round-policy";
import { paidRevisionService } from "@/features/review/paid-revision.service";
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
  paidRevisionSlotsUnlocked: number;
  nextPaidVersion: number | null;
};

const UPLOADABLE_CAMPAIGN_STATUSES = new Set<string>([
  CampaignState.ESCROW_FUNDED,
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
  hasSubmittedDeliverable: boolean;
  deliveryLocked: boolean;
  escrowReleased: boolean;
}): OrderStatus {
  const {
    campaignStatus,
    latestReviewStatus,
    hasSubmittedDeliverable,
    deliveryLocked,
    escrowReleased
  } = input;

  if (campaignStatus === CampaignState.COMPLETED || escrowReleased) {
    return "completed";
  }

  if (APPROVED_CAMPAIGN_STATUSES.has(campaignStatus) || deliveryLocked) {
    return "completed";
  }

  if (latestReviewStatus === "REVISION_REQUIRED") {
    return "revision";
  }

  if (
    campaignStatus === CampaignState.UNDER_REVIEW ||
    latestReviewStatus === "REVIEWING" ||
    latestReviewStatus === "READY"
  ) {
    return "review";
  }

  if (campaignStatus === CampaignState.PRODUCING) {
    if (latestReviewStatus === "READY" || latestReviewStatus === "REVIEWING") {
      return "review";
    }
    if (hasSubmittedDeliverable && latestReviewStatus !== "WAITING") {
      return "revision";
    }
    return "in_production";
  }

  if (
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
  if (status === "in_production" || status === "paid") return "in_production";
  if (status === "ready_for_completion" || status === "settling") return "review";
  return "review";
}

function legacyFallback(order: StoredOrder, deliverableCount: number): ReviewPortalUiState {
  const derivedOrderStatus = order.status;
  const paidRevisionSlotsUnlocked = order.paid_revision_slots_unlocked ?? 0;
  return {
    source: "legacy",
    derivedOrderStatus,
    canBrandReview: ["review", "revision"].includes(derivedOrderStatus),
    canCreatorUpload: ["paid", "in_production", "revision", "review"].includes(derivedOrderStatus),
    orderApproved: derivedOrderStatus === "completed",
    canDecide:
      (derivedOrderStatus === "review" || derivedOrderStatus === "revision") &&
      deliverableCount > 0,
    canReleaseSettlement: false,
    workflowStepIndex: reviewCenterActiveStepIndex(order, deliverableCount),
    workspaceStatus: workspaceStatusFromOrderStatus(derivedOrderStatus),
    escrowFunded: order.payment_status !== "unpaid",
    deliverableCount,
    paidRevisionSlotsUnlocked,
    nextPaidVersion: nextPaidVersionToUnlock(paidRevisionSlotsUnlocked)
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

  const [versions, delivery, escrow, paidPolicy] = await Promise.all([
    versionRepository.listByCampaign(campaign.id),
    deliveryRepository.findByCampaignIdWithVersion(campaign.id),
    paymentRepository.findByCampaignId(campaign.id),
    paidRevisionService.resolvePolicyForOrder({
      orderId: input.order.id,
      projectId: input.legacyProjectId
    })
  ]);

  const submittedVersions = versions.filter((version) => Boolean(version.videoUrl?.trim()));
  const deliverableCount = Math.max(input.deliverableCount, submittedVersions.length);
  const latestVersion = submittedVersions[submittedVersions.length - 1] ?? versions[versions.length - 1] ?? null;
  const latestReviewStatus = latestVersion?.reviewStatus ?? null;
  const hasSubmittedDeliverable = submittedVersions.length > 0;
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
    hasSubmittedDeliverable,
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

  const preservedStatus =
    input.order.status === "ready_for_completion" || input.order.status === "settling"
      ? input.order.status
      : derivedOrderStatus;

  const effectiveOrder: StoredOrder = { ...input.order, status: preservedStatus };

  return {
    source: "prisma",
    derivedOrderStatus: preservedStatus,
    canBrandReview,
    canCreatorUpload,
    orderApproved,
    canDecide,
    canReleaseSettlement,
    workflowStepIndex: reviewCenterActiveStepIndex(effectiveOrder, deliverableCount),
    workspaceStatus: workspaceStatusFromOrderStatus(preservedStatus),
    escrowFunded,
    deliverableCount,
    paidRevisionSlotsUnlocked: paidPolicy.paidRevisionSlotsUnlocked,
    nextPaidVersion: paidPolicy.nextPaidVersion
  };
}

/** Same derived phase the review portal UI uses — may differ from JSON `order.status`. */
export async function resolveLegacyOrderEffectiveStatus(input: {
  order: StoredOrder;
  deliverableCount?: number;
}): Promise<OrderStatus> {
  if (!hasDatabaseUrl() || !input.order.project_id) {
    return input.order.status;
  }

  const ui = await resolveReviewPortalUiState({
    legacyProjectId: input.order.project_id,
    order: input.order,
    deliverableCount: input.deliverableCount ?? 0
  });

  return ui.derivedOrderStatus;
}

export function reviewCenterActiveStepFromUiState(
  ui: ReviewPortalUiState,
  order: StoredOrder
): number {
  const pseudoOrder: StoredOrder = { ...order, status: ui.derivedOrderStatus };
  return reviewCenterActiveStepIndex(pseudoOrder, ui.deliverableCount);
}
