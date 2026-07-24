import "server-only";

import type { AuthUserDto } from "@/features/auth/auth.service";
import { getVideoProviderAdapter } from "@/features/video-engine/video-provider.registry";
import { videoJobAuditService } from "@/features/video-engine/video-job-audit.service";
import { VIDEO_JOB_EVENT_TYPES } from "@/features/video-engine/video-job-audit.types";
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

function resolveProviderPrompt(prompt: string) {
  return prompt.trim();
}

export class VideoOrchestrator {
  async runJob(user: AuthUserDto, job: VideoOrchestratorJob, ctx: VideoOrchestratorContext) {
    const adapter = getVideoProviderAdapter(job.provider);
    if (!adapter.isAvailable()) {
      const unavailable = adapter.unavailableError();
      await videoJobAuditService.markAttemptFailed({
        generationJobId: job.id,
        attemptId: job.attemptId,
        errorCode: unavailable.errorCode
      });
      await ctx.progress.markFailed(unavailable);
      return;
    }

    const providerPrompt = resolveProviderPrompt(job.prompt);
    await videoJobAuditService.recordProviderPromptSubmitted({
      generationJobId: job.id,
      version: 1,
      providerPrompt
    });

    try {
      const submission = await adapter.submit({
        user,
        internalModelId: job.model,
        prompt: providerPrompt,
        payload: job.input
      });

      await videoJobAuditService.updateAttemptProviderTask({
        generationJobId: job.id,
        attemptId: job.attemptId,
        providerTaskId: submission.taskId
      });

      await videoJobAuditService.writeEvent({
        generationJobId: job.id,
        eventType: VIDEO_JOB_EVENT_TYPES.PROVIDER_SUBMITTED,
        toStatus: "PROCESSING",
        progress: 25,
        payload: {
          attemptId: job.attemptId,
          providerTaskId: submission.taskId,
          model: submission.model
        }
      });

      await ctx.progress.markProcessing({ taskId: submission.taskId, progress: 25 });

      const polled = await adapter.poll({
        taskId: submission.taskId,
        onProgress: async (progress) => {
          await videoJobAuditService.writeEvent({
            generationJobId: job.id,
            eventType: VIDEO_JOB_EVENT_TYPES.PROVIDER_POLL,
            toStatus: "PROCESSING",
            progress,
            payload: {
              attemptId: job.attemptId,
              providerTaskId: submission.taskId
            }
          });
          await ctx.progress.markProcessing({ taskId: submission.taskId, progress });
        }
      });

      await ctx.progress.markPollComplete();

      await videoJobAuditService.writeEvent({
        generationJobId: job.id,
        eventType: VIDEO_JOB_EVENT_TYPES.ASSET_DOWNLOADING,
        toStatus: "PROCESSING",
        progress: 90,
        payload: { attemptId: job.attemptId }
      });

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

      await videoJobAuditService.writeEvent({
        generationJobId: job.id,
        eventType: VIDEO_JOB_EVENT_TYPES.STORAGE_SAVED,
        toStatus: "PROCESSING",
        progress: 95,
        payload: {
          attemptId: job.attemptId,
          outputAssetId: asset.id
        }
      });

      await videoJobAuditService.markAttemptSucceeded({
        generationJobId: job.id,
        attemptId: job.attemptId
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
        attemptId: job.attemptId,
        errorCode,
        error: errorMessage
      });
      await videoJobAuditService.markAttemptFailed({
        generationJobId: job.id,
        attemptId: job.attemptId,
        errorCode
      });
      await ctx.progress.markFailed({ errorCode, errorMessage });
    }
  }
}

export const videoOrchestrator = new VideoOrchestrator();
