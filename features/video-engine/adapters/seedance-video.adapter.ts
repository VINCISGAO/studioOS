import "server-only";

import type {
  VideoDownloadResult,
  VideoGenerationPollResult,
  VideoGenerationSubmitInput,
  VideoGenerationSubmitResult,
  VideoProviderAdapter,
  VideoProviderError
} from "@/features/video-engine/video-provider.types";
import {
  SeedanceApiError,
  seedanceDownloadVideo,
  seedancePollTask,
  seedanceTaskProgress
} from "@/lib/canvas/seedance-client";
import { submitSeedanceVideoTask } from "@/lib/canvas/seedance-video-request";
import { hasSeedance } from "@/lib/core/config/ai";

export const seedanceVideoAdapter: VideoProviderAdapter = {
  id: "seedance",

  isAvailable() {
    return hasSeedance();
  },

  async submit(input: VideoGenerationSubmitInput): Promise<VideoGenerationSubmitResult> {
    const submission = await submitSeedanceVideoTask(input);
    return {
      taskId: submission.taskId,
      model: submission.model,
      generationType: submission.generationType,
      providerCredits: submission.providerCredits
    };
  },

  async poll(input: {
    taskId: string;
    onProgress?: (progress: number) => Promise<void>;
  }): Promise<VideoGenerationPollResult> {
    const polled = await seedancePollTask({
      taskId: input.taskId,
      onProgress: input.onProgress
        ? async (task) => {
            await input.onProgress?.(seedanceTaskProgress(task.status));
          }
        : undefined
    });

    return {
      videoUrl: polled.videoUrl,
      videoExpiresAt: polled.task.data?.video_expires_at ?? null
    };
  },

  async download(videoUrl: string): Promise<VideoDownloadResult> {
    return seedanceDownloadVideo(videoUrl);
  },

  normalizeError(error: unknown): VideoProviderError {
    if (error instanceof SeedanceApiError) {
      return { errorCode: error.code, errorMessage: error.message };
    }

    const message =
      error instanceof Error ? error.message : "Failed to generate video";
    return { errorCode: "SEEDANCE_GENERATION_FAILED", errorMessage: message };
  },

  unavailableError(): VideoProviderError {
    return {
      errorCode: "SEEDANCE_NOT_CONFIGURED",
      errorMessage: "SEEDANCE_API_KEY is not configured"
    };
  }
};
