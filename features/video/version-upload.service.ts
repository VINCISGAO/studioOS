import { z } from "zod";
import { videoRepository } from "@/features/video/video.repository";
import { videoWorkerService } from "@/features/video/video-worker.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { CampaignState } from "@/features/campaign/campaign.state-machine";
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
import { MAX_CAMPAIGN_VERSIONS } from "@/features/delivery/version.repository";
import { looksLikeSupportedVideo } from "@/lib/studioos/upload-magic-bytes";
import {
  saveVideoVersionFromBuffer,
  videoVersionFilePath
} from "@/lib/studioos/video-version-upload";

const UPLOADABLE_CAMPAIGN_STATES = new Set<string>([CampaignState.PRODUCING, CampaignState.UNDER_REVIEW]);
const ALLOWED_UPLOAD_MIME = new Set(["video/mp4", "video/quicktime"]);

function extensionForUpload(fileName: string, mimeType: string): "mp4" | "mov" | null {
  const lower = fileName.toLowerCase();
  if (mimeType === "video/mp4" || lower.endsWith(".mp4")) return "mp4";
  if (mimeType === "video/quicktime" || lower.endsWith(".mov")) return "mov";
  return null;
}

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
    if (user.role.toUpperCase() !== "CREATOR") {
      throw appError("FORBIDDEN", "Only the selected creator can upload review versions");
    }
    if (campaign.creatorId !== user.id) {
      throw appError("FORBIDDEN", "Only the selected creator can upload review versions");
    }
    if (!UPLOADABLE_CAMPAIGN_STATES.has(campaign.status)) {
      throw appError("INVALID_TRANSITION", `Cannot upload review versions from status ${campaign.status}`);
    }
    return campaign;
  }

  async initUpload(campaignId: string, user: AuthUser, body: z.infer<typeof initUploadSchema>) {
    await this.assertCreatorUpload(campaignId, user);
    if (!ALLOWED_UPLOAD_MIME.has(body.mime_type) || !extensionForUpload(body.file_name, body.mime_type)) {
      throw appError("VALIDATION_ERROR", "Only MP4 and MOV videos are supported");
    }
    const nextVersion = await videoRepository.getNextVersionNumber(campaignId);
    if (nextVersion > MAX_CAMPAIGN_VERSIONS) {
      throw appError("VALIDATION_ERROR", `Maximum of ${MAX_CAMPAIGN_VERSIONS} review versions reached`);
    }

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
    if (session.uploadedBy !== user.id) {
      throw appError("FORBIDDEN", "Not your upload session");
    }

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
    if (session.uploadedBy !== user.id) {
      throw appError("FORBIDDEN", "Not your upload session");
    }
    const nextVersion = await videoRepository.getNextVersionNumber(session.campaignId);
    if (nextVersion > MAX_CAMPAIGN_VERSIONS) {
      throw appError("VALIDATION_ERROR", `Maximum of ${MAX_CAMPAIGN_VERSIONS} review versions reached`);
    }

    const merged = await mergeChunks(uploadId);
    videoQaService.assertUploadSize(merged.length);
    const extension = extensionForUpload(session.fileName, session.mimeType);
    if (!extension || !looksLikeSupportedVideo(merged.subarray(0, 32), extension)) {
      throw appError("VALIDATION_ERROR", "Uploaded file content does not match a supported video type");
    }

    const saved = await saveVideoVersionFromBuffer({
      campaignId: session.campaignId,
      versionNumber: nextVersion,
      buffer: merged,
      fileName: session.fileName
    });
    if (!saved.ok) throw appError("VALIDATION_ERROR", saved.error);

    const localPath = videoVersionFilePath(session.campaignId, saved.storedName);
    await videoQaService.validateSource(localPath);

    const version = await videoRepository.createVersion({
      campaignId: session.campaignId,
      versionNumber: nextVersion,
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
      versionNumber: nextVersion,
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
