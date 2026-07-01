import { campaignRepository } from "@/features/campaign/campaign.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import type { BrandProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.types";

function readLegacyProjectId(campaign: { productionBrief: unknown; id: string }): string | null {
  const brief = readProductionBrief(campaign.productionBrief) as BrandProductionBrief;
  return brief.legacy_project_id ?? campaign.id;
}

export class SettlementBridgeService {
  async syncLegacyAfterSettled(campaignId: string) {
    if (!hasDatabaseUrl()) return;

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return;

    const legacyProjectId = readLegacyProjectId(campaign);
    if (!legacyProjectId) return;

    try {
      const { getOrderForProject, markOrderEscrowReleased } = await import("@/lib/order-service");
      const order = await getOrderForProject(legacyProjectId);
      if (!order) return;

      const updated = await markOrderEscrowReleased(order.id);
      if (updated) {
        logger.info("Legacy order synced after Prisma settlement", {
          service: "SettlementBridgeService",
          campaignId,
          orderId: order.id
        });
      }
    } catch (error) {
      logger.warn("Legacy order sync after settlement failed", {
        service: "SettlementBridgeService",
        campaignId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export const settlementBridgeService = new SettlementBridgeService();
