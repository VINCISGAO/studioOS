import { campaignRepository } from "@/features/campaign/campaign.repository";
import { CampaignState } from "@/features/campaign/campaign.state-machine";
import { paymentRepository } from "@/features/payment/payment.repository";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { resolveCreatorProfileIdForLegacyId } from "@/features/matching/invitation-creator-bridge";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

const UPLOADABLE_CAMPAIGN_STATES = new Set<string>([
  CampaignState.CREATOR_ACCEPTED,
  CampaignState.PRODUCING,
  CampaignState.UNDER_REVIEW
]);

const FUNDED_ESCROW_STATES = new Set<string>([EscrowState.HELD, EscrowState.PARTIAL_RELEASE]);

export async function assertReviewVideoUploadGate(input: {
  order: { project_id?: string | null; creator_id?: string | null; payment_status?: string };
  creatorId: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!input.order.creator_id) {
    return { ok: false, status: 400, error: "Active project required before upload" };
  }

  if (input.order.creator_id !== input.creatorId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (!hasDatabaseUrl() || !input.order.project_id) {
    return { ok: true };
  }

  const campaign = await campaignRepository.findByLegacyProjectId(input.order.project_id);
  if (!campaign) {
    return { ok: true };
  }

  if (!UPLOADABLE_CAMPAIGN_STATES.has(campaign.status)) {
    return { ok: false, status: 400, error: "Cannot upload in the current campaign status" };
  }

  if (!campaign.creatorId) {
    return { ok: false, status: 400, error: "Creator must be selected before upload" };
  }

  const escrow = await paymentRepository.findByCampaignId(campaign.id);
  if (!escrow || !FUNDED_ESCROW_STATES.has(escrow.status)) {
    return { ok: false, status: 402, error: "Escrow must be funded before upload" };
  }

  const profileId = await resolveCreatorProfileIdForLegacyId(input.creatorId);
  if (!profileId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const profile = await prisma.creatorProfile.findUnique({
    where: { id: profileId },
    select: { userId: true }
  });
  if (!profile?.userId || campaign.creatorId !== profile.userId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}
