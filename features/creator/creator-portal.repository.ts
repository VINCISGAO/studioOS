import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class CreatorPortalRepository {
  private assertDb() {
    if (!hasDatabaseUrl()) throw new Error("DATABASE_URL not configured");
  }

  async findCreatorProfileByUserId(userId: string) {
    this.assertDb();
    return prisma.creatorProfile.findUnique({
      where: { userId },
      include: { user: true }
    });
  }

  async listPendingInvitations(creatorProfileId: string) {
    this.assertDb();
    return prisma.creatorInvitation.findMany({
      where: {
        creatorId: creatorProfileId,
        status: { in: ["SENT", "VIEWED"] }
      },
      include: {
        campaign: {
          include: {
            brand: { include: { brandProfile: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async listActiveCampaigns(creatorUserId: string) {
    this.assertDb();
    return prisma.campaign.findMany({
      where: {
        creatorId: creatorUserId,
        deletedAt: null,
        status: {
          notIn: ["COMPLETED", "CANCELLED"]
        }
      },
      orderBy: { updatedAt: "desc" }
    });
  }
}

export const creatorPortalRepository = new CreatorPortalRepository();
