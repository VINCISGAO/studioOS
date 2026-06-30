import { promises as fs } from "fs";
import path from "path";
import { videoRepository } from "@/features/video/video.repository";
import { versionProcessingService } from "@/features/video/version-processing.service";
import { transcodeToHls, extractThumbnail, isFfmpegAvailable } from "@/features/video/ffmpeg.service";
import { enqueueVideoJob } from "@/features/video/video-queue.service";
import {
  hlsStoragePrefix,
  isFfmpegWorkerMode,
  videoConfig
} from "@/lib/core/config/video";
import { uploadDirectory, putObject, objectStorageBackendLabel } from "@/lib/studioos/object-storage";
import {
  hlsManifestFilePath,
  videoVersionFilePath,
  writeSimulatedHlsManifest
} from "@/lib/studioos/video-version-upload";
import { logger } from "@/lib/core/logger";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import { appError } from "@/lib/core/errors";

function resolveLocalSourcePath(videoUrl: string, videoKey: string, campaignId: string) {
  if (videoUrl.startsWith("/api/campaign-videos/")) {
    const fileName = decodeURIComponent(videoUrl.split("/").pop() ?? "");
    return videoVersionFilePath(campaignId, fileName);
  }
  if (videoKey.startsWith("campaigns/")) {
    const fileName = videoKey.split("/").pop() ?? "";
    return videoVersionFilePath(campaignId, fileName);
  }
  if (videoUrl.startsWith("/") || videoUrl.startsWith(".")) {
    return path.isAbsolute(videoUrl) ? videoUrl : path.join(process.cwd(), videoUrl);
  }
  return videoUrl;
}

export class VideoWorkerService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async enqueueTranscode(input: {
    campaignId: string;
    versionId: string;
    videoUrl: string;
    watermark?: boolean;
  }) {
    this.assertDb();
    return videoRepository.createJob({
      campaignId: input.campaignId,
      versionId: input.versionId,
      payload: {
        videoUrl: input.videoUrl,
        watermark: input.watermark ?? true
      }
    });
  }

  async processJob(jobId: string) {
    this.assertDb();
    const job = await videoRepository.findJob(jobId);
    if (!job || !job.versionId) throw appError("NOT_FOUND", "Video job not found");

    const payload = job.payloadJson as { videoUrl?: string; watermark?: boolean };
    const versionId = job.versionId;

    try {
      await this.transcodeVersion({
        versionId,
        videoUrl: payload.videoUrl ?? "",
        watermark: payload.watermark ?? true
      });
      await videoRepository.completeJob(job.id);
      await this.logWorker(job.id, "info", "Video job completed", {
        versionId,
        backend: objectStorageBackendLabel()
      });
      return { ok: true as const, versionId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await versionProcessingService.markFailed(versionId);
      await videoRepository.failJob(job.id, message, job.retryCount);
      await this.logWorker(job.id, "error", message, { versionId });
      return { ok: false as const, error: message };
    }
  }

  async processNextWaiting() {
    this.assertDb();
    const job = await videoRepository.claimNextJob();
    if (!job) return null;
    return this.processJob(job.id);
  }

  /** Prefer Redis/BullMQ; fall back to inline processing for local dev. */
  scheduleProcess(jobId: string) {
    void enqueueVideoJob(jobId).then((queued) => {
      if (queued) return;
      setImmediate(() => {
        void this.processJob(jobId).catch((error) => {
          logger.error("Video worker failed", {
            service: "VideoWorkerService",
            jobId,
            error: error instanceof Error ? error.message : String(error)
          });
        });
      });
    });
  }

  private async transcodeVersion(input: {
    versionId: string;
    videoUrl: string;
    watermark: boolean;
  }) {
    const version = await prisma.campaignVersion.findUniqueOrThrow({
      where: { id: input.versionId },
      include: { campaign: true }
    });

    const storagePrefix = hlsStoragePrefix(version.campaignId, version.versionNumber);
    let hlsStorageKey = storagePrefix;
    let durationSec: number | undefined;
    let thumbnailUrl: string | undefined;

    const useFfmpeg = isFfmpegWorkerMode() && (await isFfmpegAvailable());
    const sourcePath = resolveLocalSourcePath(
      input.videoUrl || version.videoUrl || "",
      version.videoKey,
      version.campaignId
    );

    if (useFfmpeg) {
      const tmpOut = path.join(process.cwd(), ".data", "transcode", version.id);
      const { durationSec: probedDuration } = await transcodeToHls({
        sourcePath,
        outputDir: tmpOut,
        watermark: input.watermark
      });
      durationSec = probedDuration || undefined;

      await uploadDirectory(storagePrefix, tmpOut);

      const thumbLocal = path.join(tmpOut, "thumb.jpg");
      try {
        await extractThumbnail({ sourcePath, outputPath: thumbLocal });
        const thumbKey = `${storagePrefix}/thumb.jpg`;
        await putObject(thumbKey, await fs.readFile(thumbLocal), "image/jpeg");
        thumbnailUrl = thumbKey;
      } catch {
        // optional thumbnail
      }

      await fs.rm(tmpOut, { recursive: true, force: true }).catch(() => undefined);
    } else if (sourcePath && !sourcePath.startsWith("http")) {
      try {
        await fs.access(sourcePath);
        await writeSimulatedHlsManifest({
          campaignId: version.campaignId,
          versionNumber: version.versionNumber,
          storagePrefix
        });
        await uploadDirectory(storagePrefix, path.dirname(hlsManifestFilePath(version.campaignId, version.versionNumber)));
      } catch {
        hlsStorageKey = videoConfig.demoHlsUrl;
      }
    } else {
      hlsStorageKey = videoConfig.demoHlsUrl;
    }

    await videoRepository.updateVersion(input.versionId, {
      videoUrl: input.videoUrl || version.videoUrl || undefined,
      hlsUrl: hlsStorageKey,
      thumbnailUrl,
      duration: durationSec
    });

    await versionProcessingService.runPipeline(input.versionId, {
      id: version.uploadedBy,
      role: "CREATOR"
    });
  }

  private async logWorker(jobId: string, level: string, message: string, metadata?: Record<string, unknown>) {
    await prisma.workerLog.create({
      data: {
        workerName: "video.transcode",
        jobId,
        level,
        message,
        metadata: asInputJson(metadata ?? undefined)
      }
    });
  }
}

export const videoWorkerService = new VideoWorkerService();
