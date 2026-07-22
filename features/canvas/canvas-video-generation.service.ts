import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { after } from "next/server";
import { authService } from "@/features/auth/auth.service";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import { creditGenerationBillingService } from "@/features/credit-wallet/credit-generation-billing.service";
import { logger } from "@/lib/core/logger";

type VideoJobInput = {
  mode?: string;
  referenceAssetId?: string;
  referenceUrl?: string;
  referenceNodeId?: string;
  duration?: number;
  quality?: string;
};

function readVideoJobInput(raw: unknown): VideoJobInput {
  if (!raw || typeof raw !== "object") return {};
  const record = raw as Record<string, unknown>;
  return {
    mode: typeof record.mode === "string" ? record.mode : undefined,
    referenceAssetId:
      typeof record.referenceAssetId === "string" ? record.referenceAssetId : undefined,
    referenceUrl: typeof record.referenceUrl === "string" ? record.referenceUrl : undefined,
    referenceNodeId:
      typeof record.referenceNodeId === "string" ? record.referenceNodeId : undefined,
    duration: typeof record.duration === "number" ? record.duration : undefined,
    quality: typeof record.quality === "string" ? record.quality : undefined
  };
}

export class CanvasVideoGenerationService {
  scheduleJob(jobId: string, ownerId: string) {
    const run = () => {
      void this.processJob(jobId, ownerId).catch((error) => {
        logger.error("Canvas video generation failed", {
          service: "CanvasVideoGenerationService",
          jobId,
          ownerId,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    };

    try {
      after(run);
    } catch {
      run();
    }
  }

  async processJob(jobId: string, ownerId: string) {
    const job = await canvasRepository.findGenerationJob(jobId, ownerId);
    if (!job || job.type !== "VIDEO") return;
    if (job.status !== "QUEUED" && job.status !== "SUBMITTING") return;

    const user = await authService.getUserById(ownerId);
    if (!user) {
      await canvasRepository.updateGenerationJob(jobId, {
        status: "FAILED",
        progress: 100,
        errorCode: "OWNER_NOT_FOUND",
        errorMessage: "Generation owner not found",
        completedAt: new Date()
      });
      return;
    }

    await canvasRepository.updateGenerationJob(jobId, {
      status: "PROCESSING",
      progress: 25,
      startedAt: new Date()
    });

    const payload = readVideoJobInput(job.input);
    const demoPath = join(process.cwd(), "public/demo/review-sample.mp4");

    try {
      const buffer = await readFile(demoPath);
      await canvasRepository.updateGenerationJob(jobId, {
        status: "PROCESSING",
        progress: 70
      });

      const asset = await canvasAssetService.saveGeneratedVideoBuffer(job.creativeProjectId, user, {
        buffer,
        mimeType: "video/mp4",
        fileName: "canvas-generated-video.mp4",
        metadata: {
          prompt: job.prompt,
          model: job.model,
          mode: payload.mode ?? "TEXT_TO_VIDEO",
          referenceAssetId: payload.referenceAssetId ?? null,
          duration: payload.duration ?? null,
          quality: payload.quality ?? null,
          generationJobId: job.id,
          nodeId: job.nodeId,
          provider: job.provider
        }
      });

      await canvasRepository.updateGenerationJob(jobId, {
        status: "SUCCEEDED",
        progress: 100,
        outputAssetId: asset.id,
        actualCredits: job.estimatedCredits,
        completedAt: new Date()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate video";
      await canvasRepository.updateGenerationJob(jobId, {
        status: "FAILED",
        progress: 100,
        errorCode: "VIDEO_GENERATION_FAILED",
        errorMessage: message,
        completedAt: new Date()
      });
    }

    const settledJob = await canvasRepository.findGenerationJob(jobId, ownerId);
    if (settledJob) {
      await creditGenerationBillingService.syncJobBilling(settledJob);
    }
  }
}

export const canvasVideoGenerationService = new CanvasVideoGenerationService();
