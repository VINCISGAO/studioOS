import type { InvitationStatus } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class InvitationRepository {
  async listForCampaign(campaignId: string) {
    if (!hasDatabaseUrl()) return [];
    return prisma.creatorInvitation.findMany({
      where: { campaignId },
      include: {
        creator: { include: { user: true } }
      },
      orderBy: { matchScore: "desc" }
    });
  }

  async findById(id: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.creatorInvitation.findUnique({
      where: { id },
      include: {
        campaign: true,
        creator: { include: { user: true } }
      }
    });
  }

  async findExisting(campaignId: string, creatorProfileId: string) {
    return prisma.creatorInvitation.findFirst({
      where: { campaignId, creatorId: creatorProfileId }
    });
  }

  async create(input: {
    campaignId: string;
    creatorProfileId: string;
    matchScore: number;
    expiresAt?: Date;
  }) {
    return prisma.creatorInvitation.create({
      data: {
        campaignId: input.campaignId,
        creatorId: input.creatorProfileId,
        matchScore: input.matchScore,
        status: "SENT",
        expiresAt: input.expiresAt ?? new Date(Date.now() + 7 * 86400000)
      },
      include: {
        creator: { include: { user: true } }
      }
    });
  }

  async updateStatus(id: string, status: InvitationStatus, respondedAt = new Date()) {
    return prisma.creatorInvitation.update({
      where: { id },
      data: { status, respondedAt }
    });
  }

  async declineOthers(campaignId: string, exceptId: string) {
    await prisma.creatorInvitation.updateMany({
      where: { campaignId, id: { not: exceptId }, status: "SENT" },
      data: { status: "DECLINED", respondedAt: new Date() }
    });
  }
}

export const invitationRepository = new InvitationRepository();
