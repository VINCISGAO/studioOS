import { Prisma, ReviewStatus, VersionStatus, type CampaignVersion } from "@prisma/client";
import { MAX_REVIEW_VERSIONS } from "@/features/review/review-round-policy";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export const MAX_CAMPAIGN_VERSIONS = MAX_REVIEW_VERSIONS;

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
    if (!hasDatabaseUrl()) return 1;
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
    const data = {
      uploadedBy: input.uploadedBy,
      videoKey: input.videoKey,
      videoUrl: input.videoUrl,
      fileName: input.fileName ?? null,
      mimeType: input.mimeType ?? null,
      fileSizeBytes: input.fileSizeBytes ?? null,
      hlsUrl: null,
      thumbnailUrl: null,
      status: VersionStatus.UPLOADING,
      reviewStatus: ReviewStatus.WAITING,
      watermark: true,
      deletedAt: null
    };
    const existing = await prisma.campaignVersion.findFirst({
      where: { campaignId: input.campaignId, versionNumber: input.versionNumber }
    });
    if (existing) {
      return prisma.campaignVersion.update({
        where: { id: existing.id },
        data
      });
    }

    try {
      return await prisma.campaignVersion.create({
        data: {
          campaignId: input.campaignId,
          versionNumber: input.versionNumber,
          ...data
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const conflicted = await prisma.campaignVersion.findFirst({
          where: { campaignId: input.campaignId, versionNumber: input.versionNumber }
        });
        if (conflicted) {
          return prisma.campaignVersion.update({
            where: { id: conflicted.id },
            data
          });
        }
      }
      throw error;
    }
  }

  async updateVersionMedia(input: {
    campaignId: string;
    versionNumber: number;
    videoKey: string;
    videoUrl: string;
    fileName?: string | null;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    notes?: string | null;
  }): Promise<CampaignVersion | null> {
    const existing = await prisma.campaignVersion.findFirst({
      where: { campaignId: input.campaignId, versionNumber: input.versionNumber }
    });
    if (!existing) return null;

    return prisma.campaignVersion.update({
      where: { id: existing.id },
      data: {
        videoKey: input.videoKey,
        videoUrl: input.videoUrl,
        hlsUrl: null,
        thumbnailUrl: null,
        fileName: input.fileName ?? existing.fileName,
        mimeType: input.mimeType ?? existing.mimeType,
        fileSizeBytes: input.fileSizeBytes ?? existing.fileSizeBytes,
        status: VersionStatus.UPLOADING,
        reviewStatus: ReviewStatus.WAITING,
        deletedAt: null
      }
    });
  }

  async resetVersionForCreatorReupload(input: {
    campaignId: string;
    versionNumber: number;
  }): Promise<CampaignVersion | null> {
    const existing = await this.findByCampaignAndVersionNumber(input.campaignId, input.versionNumber);
    if (!existing) return null;

    return prisma.campaignVersion.update({
      where: { id: existing.id },
      data: {
        videoUrl: null,
        videoKey: "",
        fileName: null,
        mimeType: null,
        fileSizeBytes: null,
        thumbnailUrl: null,
        status: "UPLOADING",
        reviewStatus: "WAITING"
      }
    });
  }

  async softDeleteVersion(input: {
    campaignId: string;
    versionNumber: number;
  }): Promise<CampaignVersion | null> {
    const existing = await this.findByCampaignAndVersionNumber(input.campaignId, input.versionNumber);
    if (!existing) return null;

    return prisma.campaignVersion.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() }
    });
  }
}

export const versionRepository = new VersionRepository();
