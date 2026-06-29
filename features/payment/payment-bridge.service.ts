import { campaignRepository } from "@/features/campaign/campaign.repository";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";

function readLegacyProjectId(campaign: { productionBrief: unknown }): string | null {
  const brief = campaign.productionBrief as { legacy_project_id?: string } | null;
  return typeof brief?.legacy_project_id === "string" ? brief.legacy_project_id : null;
}

export class PaymentBridgeService {
  async syncLegacyAfterEscrowFunded(campaignId: string) {
    if (!hasDatabaseUrl()) return;

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) return;

    const legacyProjectId = readLegacyProjectId(campaign);
    if (!legacyProjectId) return;

    try {
      const { getOrderForProject } = await import("@/lib/order-service");
      const { syncBrandOrderPaid } = await import("@/lib/studioos/brand-checkout-service");

      const order = await getOrderForProject(legacyProjectId);
      if (!order || order.payment_status !== "unpaid") return;

      const paid = await markOrderPaid(order.id);
      if (paid) {
        await syncBrandOrderPaid(paid);
        logger.info("Legacy order marked paid after Prisma escrow", {
          service: "PaymentBridgeService",
          campaignId,
          orderId: order.id
        });
      }
    } catch (error) {
      logger.warn("Legacy order sync after escrow failed", {
        service: "PaymentBridgeService",
        campaignId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export const paymentBridgeService = new PaymentBridgeService();
