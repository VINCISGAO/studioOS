import "server-only";

import type { CampaignStatus } from "@prisma/client";
import { CampaignState } from "@/features/campaign/campaign.state-machine";
import {
  assertCampaignEscrowFunded,
  isCampaignEscrowFunded,
  isCampaignEscrowStatusActive
} from "@/features/payment/escrow-guards";
import type { OrderPaymentStatus } from "@/lib/order-types";
import { isOrderPaymentEscrowed } from "@/lib/order-types";

/** Prisma Campaign statuses that count toward brand「进行中项目」上限（不含 DRAFT/COMPLETED/CANCELLED）。 */
export const ACTIVE_CAMPAIGN_PRISMA_STATUSES: CampaignStatus[] = [
  "AI_PROCESSING",
  "CREATIVE_READY",
  "CREATIVE_APPROVED",
  "MATCHING",
  "INVITATION_SENT",
  "CREATOR_ACCEPTED",
  "ESCROW_PENDING",
  "ESCROW_FUNDED",
  "PRODUCING",
  "UNDER_REVIEW",
  "APPROVED",
  "MASTER_UPLOADED",
  "SETTLEMENT"
];

const UPLOADABLE_CAMPAIGN_STATUSES = new Set<string>([
  CampaignState.PRODUCING,
  CampaignState.UNDER_REVIEW
]);

export function isActiveCampaignStatus(status: string): boolean {
  return ACTIVE_CAMPAIGN_PRISMA_STATUSES.includes(status as CampaignStatus);
}

export function canUploadCampaignVersion(campaignStatus: string): boolean {
  return UPLOADABLE_CAMPAIGN_STATUSES.has(campaignStatus);
}

export async function canStartProduction(input: {
  campaignStatus: string;
  campaignId: string;
  orderPaymentStatus?: OrderPaymentStatus;
}): Promise<boolean> {
  if (input.campaignStatus === CampaignState.CANCELLED) {
    return false;
  }
  if (input.orderPaymentStatus && isOrderPaymentEscrowed(input.orderPaymentStatus)) {
    return true;
  }
  return isCampaignEscrowFunded(input.campaignId);
}

export async function assertCanStartProduction(input: {
  campaignStatus: string;
  campaignId: string;
  orderPaymentStatus?: OrderPaymentStatus;
}): Promise<void> {
  const allowed = await canStartProduction(input);
  if (!allowed) {
    throw new Error("Escrow must be funded before production");
  }
}

export async function canUploadVersion(input: {
  campaignStatus: string;
  campaignId: string;
  creatorUserId: string | null;
  selectedCreatorUserId: string | null;
  escrowStatus?: string | null;
}): Promise<boolean> {
  if (!canUploadCampaignVersion(input.campaignStatus)) {
    return false;
  }
  if (!input.selectedCreatorUserId || input.creatorUserId !== input.selectedCreatorUserId) {
    return false;
  }
  if (input.escrowStatus) {
    return isCampaignEscrowStatusActive(input.escrowStatus);
  }
  return isCampaignEscrowFunded(input.campaignId);
}

export async function canReleaseEscrow(campaignId: string): Promise<boolean> {
  return isCampaignEscrowFunded(campaignId);
}

export async function assertCanReleaseEscrow(campaignId: string): Promise<void> {
  await assertCampaignEscrowFunded(campaignId, "Escrow must be funded before release");
}
