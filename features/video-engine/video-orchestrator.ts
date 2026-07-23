import "server-only";

import type { AuthUserDto } from "@/features/auth/auth.service";
import { getVideoProviderAdapter } from "@/features/video-engine/video-provider.registry";
import type {
  VideoOrchestratorContext,
  VideoOrchestratorJob
} from "@/features/video-engine/video-generation.types";
import { logger } from "@/lib/core/logger";

function videoExtensionFromMime(mimeType: string) {
  if (mimeType === "video/quicktime") return "mov";
  if (mimeType === "video/webm") return "webm";
  return "mp4";
}

export class VideoOrchestrator {
  async runJob(user: AuthUserDto, job: VideoOrchestratorJob, ctx: VideoOrchestratorContext) {
    const adapter = getVideoProviderAdapter(job.provider);
    if (!adapter.isAvailable()) {
      const unavailable = adapter.unavailableError();
      await ctx.progress.markFailed(unavailable);
      return;
    }

    try {
      const submission = await adapter.submit({
        user,
        internalModelId: job.model,
        prompt: job.prompt,
        payload: job.input
      });

      await ctx.progress.markProcessing({ taskId: submission.taskId, progress: 25 });

      const polled = await adapter.poll({
        taskId: submission.taskId,
        onProgress: async (progress) => {
          await ctx.progress.markProcessing({ taskId: submission.taskId, progress });
        }
      });

      await ctx.progress.markPollComplete();

      const downloaded = await adapter.download(polled.videoUrl);
      const asset = await ctx.storage.saveGeneratedVideo({
        projectId: job.creativeProjectId,
        buffer: downloaded.buffer,
        mimeType: downloaded.mimeType,
        fileName: `canvas-generated-video.${videoExtensionFromMime(downloaded.mimeType)}`,
        metadata: {
          prompt: job.prompt,
          model: job.model,
          seedanceModel: submission.model,
          seedanceTaskId: submission.taskId,
          seedanceGenerationType: submission.generationType,
          seedanceProviderCredits: submission.providerCredits,
          generationJobId: job.id,
          nodeId: job.nodeId,
          provider: job.provider,
          videoExpiresAt: polled.videoExpiresAt
        }
      });

      await ctx.progress.markSucceeded({
        outputAssetId: asset.id,
        actualCredits: job.estimatedCredits
      });
    } catch (error) {
      const { errorCode, errorMessage } = adapter.normalizeError(error);
      logger.error("Video orchestrator failed", {
        service: "VideoOrchestrator",
        jobId: job.id,
        errorCode,
        error: errorMessage
      });
      await ctx.progress.markFailed({ errorCode, errorMessage });
    }
  }
}

export const videoOrchestrator = new VideoOrchestrator();
