import "server-only";

import { campaignRepository } from "@/features/campaign/campaign.repository";
import { paymentRepository } from "@/features/payment/payment.repository";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isOrderPaymentEscrowed, type OrderPaymentStatus } from "@/lib/order-types";

/** Escrow held or partially/full released — campaign is considered funded. */
export const CAMPAIGN_ESCROW_FUNDED_STATES = new Set<string>([
  EscrowState.HELD,
  EscrowState.PARTIAL_RELEASE,
  EscrowState.FULL_RELEASE
]);

/** Active production escrow — excludes full release (upload gates). */
export const CAMPAIGN_ESCROW_ACTIVE_STATES = new Set<string>([
  EscrowState.HELD,
  EscrowState.PARTIAL_RELEASE
]);

export function isCampaignEscrowStatusFunded(status: string | null | undefined): boolean {
  return Boolean(status && CAMPAIGN_ESCROW_FUNDED_STATES.has(status));
}

export function isCampaignEscrowStatusActive(status: string | null | undefined): boolean {
  return Boolean(status && CAMPAIGN_ESCROW_ACTIVE_STATES.has(status));
}

export async function isCampaignEscrowFunded(campaignId: string): Promise<boolean> {
  const escrow = await paymentRepository.findByCampaignId(campaignId);
  return isCampaignEscrowStatusFunded(escrow?.status);
}

export async function assertCampaignEscrowFunded(
  campaignId: string,
  message = "Escrow must be funded before this action"
): Promise<void> {
  if (!(await isCampaignEscrowFunded(campaignId))) {
    throw appError("INVALID_TRANSITION", message);
  }
}

/** AI / collaboration gates — legacy order payment OR Prisma campaign escrow. */
export async function assertProjectFundedForAi(
  projectId: string,
  orderPaymentStatus?: OrderPaymentStatus
): Promise<void> {
  if (orderPaymentStatus && isOrderPaymentEscrowed(orderPaymentStatus)) {
    return;
  }

  if (!hasDatabaseUrl()) {
    throw appError("INVALID_TRANSITION", "AI creative generation is available only after escrow payment");
  }

  const campaign = await campaignRepository.findByLegacyProjectId(projectId);
  if (!campaign) {
    throw appError("INVALID_TRANSITION", "AI creative generation is available only after escrow payment");
  }

  await assertCampaignEscrowFunded(
    campaign.id,
    "AI creative generation is available only after escrow payment"
  );
}
