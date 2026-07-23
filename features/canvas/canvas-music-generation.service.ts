import { after } from "next/server";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { authService } from "@/features/auth/auth.service";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import { finalizeCanvasGenerationJob } from "@/features/canvas/canvas-generation-learning";
import { canvasRepository } from "@/features/canvas/canvas.repository";
import {
  MurekaApiError,
  murekaDownloadAudio,
  murekaPollTask,
  murekaTaskProgress
} from "@/lib/canvas/mureka-client";
import { submitMurekaMusicTask } from "@/lib/canvas/mureka-music-request";
import { hasMureka } from "@/lib/core/config/ai";
import { logger } from "@/lib/core/logger";

async function failJob(
  jobId: string,
  input: { errorCode: string; errorMessage: string }
) {
  await canvasRepository.updateGenerationJob(jobId, {
    status: "FAILED",
    progress: 100,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    completedAt: new Date()
  });
}

export class CanvasMusicGenerationService {
  scheduleJob(jobId: string, ownerId: string) {
    const run = () => {
      void this.processJob(jobId, ownerId).catch((error) => {
        logger.error("Canvas music generation failed", {
          service: "CanvasMusicGenerationService",
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
    let user: AuthUserDto | null = null;

    try {
      let job = await canvasRepository.findGenerationJob(jobId, ownerId);
      if (!job || job.type !== "MUSIC") return;
      if (job.status !== "QUEUED" && job.status !== "SUBMITTING") return;

      user = await authService.getUserById(ownerId);
    if (!user) {
      await failJob(jobId, {
        errorCode: "OWNER_NOT_FOUND",
        errorMessage: "Generation owner not found"
      });
      return;
    }

    if (!hasMureka() || job.provider !== "mureka") {
      await failJob(jobId, {
        errorCode: "MUREKA_NOT_CONFIGURED",
        errorMessage: "MUREKA_API_KEY is not configured"
      });
      return;
    }

    await canvasRepository.updateGenerationJob(jobId, {
      status: "PROCESSING",
      progress: 15,
      startedAt: new Date()
    });

    try {
      const submission = await submitMurekaMusicTask({
        internalModelId: job.model,
        prompt: job.prompt,
        payload: job.input
      });

      await canvasRepository.updateGenerationJob(jobId, {
        status: "PROCESSING",
        progress: 25,
        providerTaskId: submission.task.id
      });

      const polled = await murekaPollTask({
        kind: submission.kind,
        taskId: submission.task.id,
        onProgress: async (task) => {
          await canvasRepository.updateGenerationJob(jobId, {
            status: "PROCESSING",
            progress: murekaTaskProgress(task.status)
          });
        }
      });

      await canvasRepository.updateGenerationJob(jobId, {
        status: "PROCESSING",
        progress: 88
      });

      const downloaded = await murekaDownloadAudio(polled.audioUrl);
      const extension =
        downloaded.mimeType === "audio/wav"
          ? "wav"
          : downloaded.mimeType === "audio/mp4"
            ? "m4a"
            : "mp3";

      const asset = await canvasAssetService.saveGeneratedAudioBuffer(job.creativeProjectId, user, {
        buffer: downloaded.buffer,
        mimeType: downloaded.mimeType,
        fileName: `canvas-generated-music.${extension}`,
        metadata: {
          prompt: job.prompt,
          model: job.model,
          murekaModel: submission.model,
          murekaTaskId: submission.task.id,
          generationJobId: job.id,
          nodeId: job.nodeId,
          provider: job.provider,
          audioUrlExpiresInDays: 30
        }
      });

      job = await canvasRepository.updateGenerationJob(jobId, {
        status: "SUCCEEDED",
        progress: 100,
        outputAssetId: asset.id,
        actualCredits: job.estimatedCredits,
        completedAt: new Date()
      });
    } catch (error) {
      const message =
        error instanceof MurekaApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to generate music";
      const errorCode = error instanceof MurekaApiError ? error.code : "MUREKA_GENERATION_FAILED";

      logger.error("Canvas music generation failed", {
        service: "CanvasMusicGenerationService",
        jobId,
        ownerId,
        errorCode,
        traceId: error instanceof MurekaApiError ? error.traceId : undefined,
        error: message
      });

      await failJob(jobId, { errorCode, errorMessage: message });
    }

    } finally {
      await finalizeCanvasGenerationJob(user, jobId, ownerId);
    }
  }
}

export const canvasMusicGenerationService = new CanvasMusicGenerationService();
