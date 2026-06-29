import type { ReviewComment, ReviewAnnotation, CampaignVersion } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export type VersionWithComments = CampaignVersion & {
  comments: (ReviewComment & { annotations: ReviewAnnotation[] })[];
};

export class ReviewRepository {
  async findVersion(versionId: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaignVersion.findFirst({
      where: { id: versionId, deletedAt: null },
      include: { campaign: true }
    });
  }

  async listVersionsForCampaign(campaignId: string): Promise<VersionWithComments[]> {
    if (!hasDatabaseUrl()) return [];
    return prisma.campaignVersion.findMany({
      where: { campaignId, deletedAt: null },
      include: {
        comments: {
          where: { deletedAt: null },
          orderBy: { timeSeconds: "asc" },
          include: { annotations: true }
        }
      },
      orderBy: { versionNumber: "asc" }
    });
  }

  async listComments(versionId: string) {
    if (!hasDatabaseUrl()) return [];
    return prisma.reviewComment.findMany({
      where: { versionId, deletedAt: null },
      orderBy: { timeSeconds: "asc" },
      include: { annotations: true, user: true }
    });
  }
}

export const reviewRepository = new ReviewRepository();
