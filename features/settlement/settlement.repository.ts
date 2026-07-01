import type { Campaign, CampaignDelivery, EscrowPayment, OrderCommission } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export type SettlementContext = {
  campaign: Campaign;
  escrow: EscrowPayment | null;
  delivery: CampaignDelivery | null;
  commission: OrderCommission | null;
};

export class SettlementRepository {
  async findContextByCampaignId(campaignId: string): Promise<SettlementContext | null> {
    if (!hasDatabaseUrl()) return null;

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, deletedAt: null }
    });
    if (!campaign) return null;

    const [escrow, delivery, commission] = await Promise.all([
      prisma.escrowPayment.findUnique({ where: { campaignId } }),
      prisma.campaignDelivery.findUnique({ where: { campaignId } }),
      prisma.orderCommission.findUnique({ where: { campaignId } })
    ]);

    return { campaign, escrow, delivery, commission };
  }

  async findContextByLegacyProjectId(legacyProjectId: string): Promise<SettlementContext | null> {
    if (!hasDatabaseUrl()) return null;

    const campaign = await prisma.campaign.findFirst({
      where: {
        deletedAt: null,
        productionBrief: {
          path: ["legacy_project_id"],
          equals: legacyProjectId
        }
      }
    });
    if (!campaign) return null;

    return this.findContextByCampaignId(campaign.id);
  }

  async markCreatorPayoutReleased(campaignId: string, markedByUserId?: string | null) {
    return prisma.escrowPayment.update({
      where: { campaignId },
      data: {
        creatorPayoutStatus: "PAID",
        payoutPaidAt: new Date(),
        payoutMarkedByAdminId: markedByUserId ?? null
      }
    });
  }

  async sumHeldEscrowForCreator(creatorUserId: string): Promise<number> {
    if (!hasDatabaseUrl()) return 0;

    const rows = await prisma.escrowPayment.findMany({
      where: {
        creatorId: creatorUserId,
        status: { in: ["HELD", "PARTIAL_RELEASE"] }
      },
      select: { remainingAmount: true }
    });

    return rows.reduce((sum, row) => sum + Number(row.remainingAmount), 0);
  }

  async listPendingSettlementCampaignIds(creatorUserId: string): Promise<string[]> {
    if (!hasDatabaseUrl()) return [];

    const rows = await prisma.campaign.findMany({
      where: {
        creatorId: creatorUserId,
        deletedAt: null,
        status: { in: ["MASTER_UPLOADED", "SETTLEMENT"] },
        deliveries: { some: { status: "LOCKED" } },
        escrow: { status: "HELD" }
      },
      select: { id: true }
    });

    return rows.map((row) => row.id);
  }
}

export const settlementRepository = new SettlementRepository();
