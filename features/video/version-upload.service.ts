import { z } from "zod";
import { videoRepository } from "@/features/video/video.repository";
import { videoWorkerService } from "@/features/video/video-worker.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { PermissionService, type AuthUser } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import {
  createChunkSession,
  getChunkSession,
  mergeChunks,
  saveChunk,
  deleteChunkSession,
  DEFAULT_CHUNK_BYTES
} from "@/features/video/video-upload.store";
import { videoQaService } from "@/features/video/video-qa.service";
import { buildVersionPlayback } from "@/features/video/playback-token.service";
import {
  saveVideoVersionFromBuffer,
  videoVersionFilePath
} from "@/lib/studioos/video-version-upload";

export const initUploadSchema = z.object({
  file_name: z.string().trim().min(1).max(255),
  mime_type: z.string().trim().min(1),
  total_size: z.number().int().positive().max(500 * 1024 * 1024)
});

export class VersionUploadService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  private async assertCreatorUpload(campaignId: string, user: AuthUser) {
    this.assertDb();
    PermissionService.assert(user, "asset.upload");
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }
    if (user.role.toUpperCase() === "BRAND") {
      throw appError("FORBIDDEN", "Brands cannot upload review versions");
    }
    return campaign;
  }

  async initUpload(campaignId: string, user: AuthUser, body: z.infer<typeof initUploadSchema>) {
    await this.assertCreatorUpload(campaignId, user);

    const session = await createChunkSession({
      campaignId,
      fileName: body.file_name,
      mimeType: body.mime_type,
      totalSize: body.total_size,
      uploadedBy: user.id
    });

    return {
      uploadId: session.id,
      chunkSize: DEFAULT_CHUNK_BYTES,
      totalChunks: session.totalChunks
    };
  }

  async uploadChunk(uploadId: string, chunkIndex: number, data: Buffer, user: AuthUser) {
    const session = await getChunkSession(uploadId);
    if (!session) throw appError("NOT_FOUND", "Upload session not found");
    await this.assertCreatorUpload(session.campaignId, user);

    const updated = await saveChunk(uploadId, chunkIndex, data);
    return {
      uploadId,
      receivedChunks: updated.receivedChunks.length,
      totalChunks: updated.totalChunks,
      complete: updated.receivedChunks.length === updated.totalChunks
    };
  }

  async completeUpload(uploadId: string, user: AuthUser) {
    const session = await getChunkSession(uploadId);
    if (!session) throw appError("NOT_FOUND", "Upload session not found");
    await this.assertCreatorUpload(session.campaignId, user);

    const merged = await mergeChunks(uploadId);
    videoQaService.assertUploadSize(merged.length);

    const versionNumber = await videoRepository.getNextVersionNumber(session.campaignId);
    const saved = await saveVideoVersionFromBuffer({
      campaignId: session.campaignId,
      versionNumber,
      buffer: merged,
      fileName: session.fileName
    });
    if (!saved.ok) throw appError("VALIDATION_ERROR", saved.error);

    const localPath = videoVersionFilePath(session.campaignId, saved.storedName);
    await videoQaService.validateSource(localPath);

    const version = await videoRepository.createVersion({
      campaignId: session.campaignId,
      versionNumber,
      uploadedBy: user.id,
      videoKey: saved.file_key,
      videoUrl: saved.url
    });

    const job = await videoWorkerService.enqueueTranscode({
      campaignId: session.campaignId,
      versionId: version.id,
      videoUrl: saved.url,
      watermark: true
    });

    videoWorkerService.scheduleProcess(job.id);
    await deleteChunkSession(uploadId);

    return {
      versionId: version.id,
      versionNumber,
      jobId: job.id,
      status: version.status,
      playback: buildVersionPlayback(version, user.id)
    };
  }

  async createVersionFromUrl(input: {
    campaignId: string;
    uploadedBy: string;
    videoUrl: string;
    videoKey: string;
  }) {
    this.assertDb();
    const versionNumber = await videoRepository.getNextVersionNumber(input.campaignId);
    const version = await videoRepository.createVersion({
      campaignId: input.campaignId,
      versionNumber,
      uploadedBy: input.uploadedBy,
      videoKey: input.videoKey,
      videoUrl: input.videoUrl
    });

    const job = await videoWorkerService.enqueueTranscode({
      campaignId: input.campaignId,
      versionId: version.id,
      videoUrl: input.videoUrl,
      watermark: true
    });

    videoWorkerService.scheduleProcess(job.id);
    return { version, job };
  }
}

export const versionUploadService = new VersionUploadService();
