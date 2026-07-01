import type { CampaignVersion } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export const MAX_CAMPAIGN_VERSIONS = 3;

export class VersionRepository {
  async countByCampaign(campaignId: string): Promise<number> {
    if (!hasDatabaseUrl()) return 0;
    return prisma.campaignVersion.count({
      where: { campaignId, deletedAt: null }
    });
  }

  async listByCampaign(campaignId: string): Promise<CampaignVersion[]> {
    if (!hasDatabaseUrl()) return [];
    return prisma.campaignVersion.findMany({
      where: { campaignId, deletedAt: null },
      orderBy: { versionNumber: "asc" }
    });
  }

  async findByCampaignAndVersionNumber(
    campaignId: string,
    versionNumber: number
  ): Promise<CampaignVersion | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.campaignVersion.findFirst({
      where: { campaignId, versionNumber, deletedAt: null }
    });
  }

  async getNextVersionNumber(campaignId: string): Promise<number> {
    const latest = await prisma.campaignVersion.findFirst({
      where: { campaignId, deletedAt: null },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true }
    });
    return (latest?.versionNumber ?? 0) + 1;
  }

  async createVersion(input: {
    campaignId: string;
    versionNumber: number;
    uploadedBy: string;
    videoKey: string;
    videoUrl: string;
    fileName?: string | null;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    notes?: string | null;
  }): Promise<CampaignVersion> {
    return prisma.campaignVersion.create({
      data: {
        campaignId: input.campaignId,
        versionNumber: input.versionNumber,
        uploadedBy: input.uploadedBy,
        videoKey: input.videoKey,
        videoUrl: input.videoUrl,
        fileName: input.fileName ?? null,
        mimeType: input.mimeType ?? null,
        fileSizeBytes: input.fileSizeBytes ?? null,
        status: "READY",
        reviewStatus: "READY",
        watermark: true
      }
    });
  }
}

export const versionRepository = new VersionRepository();
