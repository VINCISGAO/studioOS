import type { VideoJob, CampaignVersion } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

export class VideoRepository {
  async createJob(input: {
    campaignId: string;
    versionId: string;
    queue?: string;
    payload: Record<string, unknown>;
  }): Promise<VideoJob> {
    return prisma.videoJob.create({
      data: {
        campaignId: input.campaignId,
        versionId: input.versionId,
        queue: input.queue ?? "video.transcode",
        status: "WAITING",
        payloadJson: asInputJson(input.payload)!,
      }
    });
  }

  async findJob(id: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.videoJob.findUnique({ where: { id } });
  }

  async claimNextJob(queue = "video.transcode"): Promise<VideoJob | null> {
    const job = await prisma.videoJob.findFirst({
      where: { queue, status: { in: ["WAITING", "RETRY"] } },
      orderBy: { createdAt: "asc" }
    });
    if (!job) return null;

    return prisma.videoJob.update({
      where: { id: job.id, status: job.status },
      data: { status: "RUNNING", startedAt: new Date(), error: null }
    });
  }

  async completeJob(id: string) {
    return prisma.videoJob.update({
      where: { id },
      data: { status: "SUCCESS", finishedAt: new Date() }
    });
  }

  async failJob(id: string, error: string, retryCount: number) {
    const nextStatus = retryCount + 1 >= 3 ? "DEAD" : "RETRY";
    return prisma.videoJob.update({
      where: { id },
      data: {
        status: nextStatus,
        error,
        retryCount: retryCount + 1,
        finishedAt: nextStatus === "DEAD" ? new Date() : null
      }
    });
  }

  async createVersion(input: {
    campaignId: string;
    versionNumber: number;
    uploadedBy: string;
    videoKey: string;
    videoUrl?: string;
  }): Promise<CampaignVersion> {
    return prisma.campaignVersion.create({
      data: {
        campaignId: input.campaignId,
        versionNumber: input.versionNumber,
        uploadedBy: input.uploadedBy,
        videoKey: input.videoKey,
        videoUrl: input.videoUrl,
        status: "UPLOADING",
        reviewStatus: "WAITING",
        watermark: true
      }
    });
  }

  async updateVersion(
    versionId: string,
    data: Partial<{
      videoUrl: string;
      hlsUrl: string;
      thumbnailUrl: string;
      status: CampaignVersion["status"];
      reviewStatus: CampaignVersion["reviewStatus"];
      duration: number;
    }>
  ) {
    return prisma.campaignVersion.update({
      where: { id: versionId },
      data: {
        ...data,
        duration: data.duration != null ? data.duration : undefined
      }
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
}

export const videoRepository = new VideoRepository();
