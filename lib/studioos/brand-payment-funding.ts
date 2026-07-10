import { campaignRepository } from "@/features/campaign/campaign.repository";
import { paymentRepository } from "@/features/payment/payment.repository";
import { EscrowState } from "@/features/shared/state-machines/escrow.state-machine";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isOrderPaymentEscrowed, type StoredOrder } from "@/lib/order-types";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";
import type { StoredProject } from "@/lib/project-types";

const FUNDED_ESCROW_STATES = new Set<string>([
  EscrowState.HELD,
  EscrowState.PARTIAL_RELEASE,
  EscrowState.FULL_RELEASE
]);

export async function isPrismaEscrowFundedForProject(projectId: string): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;

  const campaign = await campaignRepository.findByLegacyProjectId(projectId);
  if (!campaign) return false;

  const escrow = await paymentRepository.findByCampaignId(campaign.id);
  return escrow ? FUNDED_ESCROW_STATES.has(escrow.status) : false;
}

export function isLegacyOrderFunded(order: StoredOrder | null | undefined): boolean {
  return Boolean(order && isOrderPaymentEscrowed(order.payment_status));
}

/** Single funded signal — legacy JSON order OR Prisma escrow */
export async function isBrandProjectFunded(
  projectId: string,
  order: StoredOrder | null | undefined
): Promise<boolean> {
  if (isLegacyOrderFunded(order)) return true;
  return isPrismaEscrowFundedForProject(projectId);
}

export function isBrandProjectCancelled(
  project: Pick<StoredProject, "status">,
  order: StoredOrder | null | undefined
): boolean {
  return (
    normalizeCampaignStatus(project.status) === "cancelled" || order?.status === "cancelled"
  );
}

/**
 * Match tab → checkout redirect.
 * One rule: unpaid + not cancelled + no active creator project.
 */
export function shouldBrandMatchTabRedirectToCheckout(input: {
  activeTab: string;
  funded: boolean;
  hasActiveProject: boolean;
  cancelled: boolean;
}): boolean {
  if (input.activeTab !== "match") return false;
  if (input.cancelled || input.hasActiveProject || input.funded) return false;
  return true;
}
