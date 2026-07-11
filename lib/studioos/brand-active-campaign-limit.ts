import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard";
import type { CampaignProjectStatus } from "@/lib/studioos/project-status";
import { normalizeCampaignStatus } from "@/lib/studioos/project-status";

/** Platform recommendation — not a hard product cap in copy, but enforced at 3. */
export const BRAND_ACTIVE_CAMPAIGN_LIMIT = 3;

/**
 * Statuses that count toward simultaneous active campaigns.
 * Draft / cancelled / completed are excluded.
 */
const ACTIVE_CAMPAIGN_STATUSES = new Set<CampaignProjectStatus>([
  "matching",
  "studio_selected",
  "proposal",
  "contract_pending",
  "payment_pending",
  "production",
  "in_review",
  "delivered",
  "disputed"
]);

export type BrandNewCampaignGate = "allow" | "warn" | "block" | "rate_limit";

export function countsAsActiveCampaign(rawStatus: string): boolean {
  return ACTIVE_CAMPAIGN_STATUSES.has(normalizeCampaignStatus(rawStatus));
}

export function countActiveCampaignRows(rows: BrandProjectRow[]): number {
  return rows.filter((row) => countsAsActiveCampaign(String(row.status))).length;
}

export function resolveBrandNewCampaignGate(activeCount: number): BrandNewCampaignGate {
  if (activeCount >= BRAND_ACTIVE_CAMPAIGN_LIMIT) {
    return "block";
  }
  if (activeCount >= 1) {
    return "warn";
  }
  return "allow";
}

export function brandActiveCampaignSlotsRemaining(activeCount: number): number {
  return Math.max(0, BRAND_ACTIVE_CAMPAIGN_LIMIT - activeCount);
}
