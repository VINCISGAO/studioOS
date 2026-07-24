import "server-only";

import type {
  VideoDownloadResult,
  VideoGenerationPollResult,
  VideoGenerationSubmitInput,
  VideoGenerationSubmitResult,
  VideoProviderAdapter,
  VideoProviderError
} from "@/features/video-engine/video-provider.types";
import { isMockVideoProviderEnabled } from "@/features/video-engine/mock-provider-env";

export const mockVideoAdapter: VideoProviderAdapter = {
  id: "vincis-mock",

  isAvailable() {
    return isMockVideoProviderEnabled();
  },

  async submit(_input: VideoGenerationSubmitInput): Promise<VideoGenerationSubmitResult> {
    throw new Error("Mock video provider is not available");
  },

  async poll(_input: {
    taskId: string;
    onProgress?: (progress: number) => Promise<void>;
  }): Promise<VideoGenerationPollResult> {
    throw new Error("Mock video provider is not available");
  },

  async download(_videoUrl: string): Promise<VideoDownloadResult> {
    throw new Error("Mock video provider is not available");
  },

  normalizeError(error: unknown): VideoProviderError {
    const message =
      error instanceof Error ? error.message : "Failed to generate video";
    return { errorCode: "MOCK_VIDEO_UNAVAILABLE", errorMessage: message };
  },

  unavailableError(): VideoProviderError {
    return {
      errorCode: "SEEDANCE_NOT_CONFIGURED",
      errorMessage: "SEEDANCE_API_KEY is not configured"
    };
  }
};
