import { campaignRepository } from "@/features/campaign/campaign.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isMissingPrismaMigrationError } from "@/lib/core/database/prisma-migration-errors";

/** Prisma campaign row exists for this legacy project — JSON store must not be written. */
export async function hasPrismaCampaignForProject(projectId: string): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  const campaign = await campaignRepository.findByLegacyProjectId(projectId);
  return Boolean(campaign);
}

export function isLegacyJsonInvitationMode(): boolean {
  return !hasDatabaseUrl();
}

/** Only when Prisma schema is not migrated may we read/write JSON invitations. */
export function canUseLegacyJsonFallback(error: unknown): boolean {
  return isMissingPrismaMigrationError(error);
}
