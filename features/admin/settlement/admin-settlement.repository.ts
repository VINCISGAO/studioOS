import type { Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export type AdminSettlementQueueFilters = {
  state?: string;
  limit?: number;
  offset?: number;
};

export class AdminSettlementRepository {
  async listCampaigns(filters: AdminSettlementQueueFilters) {
    if (!hasDatabaseUrl()) return [];

    const where: Prisma.CampaignWhereInput = {
      deletedAt: null,
      OR: [
        { deliveries: { is: { status: "LOCKED" } } },
        { escrow: { status: { in: ["HELD", "PARTIAL_RELEASE", "FULL_RELEASE", "CLOSED"] } } },
        { orderCommission: { isNot: null } },
        { disputes: { some: { status: { in: ["OPEN", "PROCESSING"] } } } }
      ]
    };

    return prisma.campaign.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: filters.limit ?? 100,
      skip: filters.offset ?? 0,
      include: {
        brand: { select: { fullName: true, email: true, brandProfile: { select: { companyName: true } } } },
        creator: { select: { fullName: true, creatorProfile: { select: { displayName: true } } } },
        escrow: true,
        deliveries: true,
        orderCommission: true,
        disputes: { where: { status: { in: ["OPEN", "PROCESSING"] } } },
        ledgerEntries: { orderBy: { createdAt: "desc" }, take: 3 }
      }
    });
  }
}

export const adminSettlementRepository = new AdminSettlementRepository();
