import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class BrandPortalRepository {
  private assertDb() {
    if (!hasDatabaseUrl()) throw new Error("DATABASE_URL not configured");
  }

  async listCampaignsForBrand(brandUserId: string) {
    this.assertDb();
    return prisma.campaign.findMany({
      where: { brandId: brandUserId, deletedAt: null },
      orderBy: { updatedAt: "desc" }
    });
  }

  async listEscrowsForBrand(brandUserId: string) {
    this.assertDb();
    return prisma.escrowPayment.findMany({
      where: { brandId: brandUserId },
      include: { campaign: true },
      orderBy: { updatedAt: "desc" }
    });
  }

  async listReviewReadyCampaigns(brandUserId: string) {
    this.assertDb();
    return prisma.campaign.findMany({
      where: {
        brandId: brandUserId,
        deletedAt: null,
        status: { in: ["UNDER_REVIEW", "APPROVED", "MASTER_UPLOADED", "SETTLEMENT"] }
      },
      orderBy: { updatedAt: "desc" }
    });
  }
}

export const brandPortalRepository = new BrandPortalRepository();
