import { campaignRepository } from "@/features/campaign/campaign.repository";
import { orderRepository } from "@/features/order/order.repository";
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

    const confirmed = await orderRepository.confirmPendingCampaignOrders(campaignId);
    if (confirmed.count > 0) {
      logger.info("Prisma orders confirmed after escrow funded", {
        service: "PaymentBridgeService",
        campaignId,
        count: confirmed.count
      });
    }

    const legacyProjectId = readLegacyProjectId(campaign);
    if (!legacyProjectId) return;

    try {
      const { getOrderForProject, markOrderPaid } = await import("@/lib/order-service");
      const { syncBrandOrderPaid } = await import("@/lib/studioos/brand-checkout-service");
      const { getProject } = await import("@/lib/project-service");
      const { publishCampaignIntentInvitations } = await import(
        "@/lib/studioos/campaign-invitation-notify"
      );

      const order = await getOrderForProject(legacyProjectId);
      if (order?.payment_status === "unpaid") {
        const paid = await markOrderPaid(order.id);
        if (paid) {
          await syncBrandOrderPaid(paid);
          logger.info("Legacy order marked paid after Prisma escrow", {
            service: "PaymentBridgeService",
            campaignId,
            orderId: order.id
          });
        }
      }

      const project = await getProject(legacyProjectId);
      if (project) {
        await publishCampaignIntentInvitations({
          project,
          locale: order?.client_locale === "zh" ? "zh" : "en"
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
