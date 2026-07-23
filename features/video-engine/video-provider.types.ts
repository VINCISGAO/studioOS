import type { AuthUserDto } from "@/features/auth/auth.service";

export type VideoProviderId = "seedance" | "vincis-mock";

export type VideoGenerationSubmitInput = {
  user: AuthUserDto;
  internalModelId: string;
  prompt: string;
  payload: unknown;
  callbackUrl?: string | null;
};

export type VideoGenerationSubmitResult = {
  taskId: string;
  model: string;
  generationType: string;
  providerCredits?: number;
};

export type VideoGenerationPollResult = {
  videoUrl: string;
  videoExpiresAt: string | null;
};

export type VideoDownloadResult = {
  buffer: Buffer;
  mimeType: string;
};

export type VideoProviderError = {
  errorCode: string;
  errorMessage: string;
};

export interface VideoProviderAdapter {
  readonly id: VideoProviderId;
  isAvailable(): boolean;
  submit(input: VideoGenerationSubmitInput): Promise<VideoGenerationSubmitResult>;
  poll(input: {
    taskId: string;
    onProgress?: (progress: number) => Promise<void>;
  }): Promise<VideoGenerationPollResult>;
  download(videoUrl: string): Promise<VideoDownloadResult>;
  normalizeError(error: unknown): VideoProviderError;
  unavailableError(): VideoProviderError;
}
