export type ProviderTaskStatus = "queued" | "processing" | "succeeded" | "failed";

export type GenerationResult = {
  providerTaskId: string;
  status: ProviderTaskStatus;
  outputUrls?: string[];
  credits?: number;
  error?: string;
};

export interface ImageProvider {
  submit(input: {
    prompt: string;
    model: string;
    aspectRatio: string;
    resolution: string;
    referenceUrls?: string[];
  }): Promise<GenerationResult>;
  getStatus(providerTaskId: string): Promise<GenerationResult>;
}

export interface VideoProvider {
  submit(input: {
    prompt: string;
    model: string;
    duration: number;
    aspectRatio: string;
    firstFrameUrl?: string;
    lastFrameUrl?: string;
  }): Promise<GenerationResult>;
  getStatus(providerTaskId: string): Promise<GenerationResult>;
}

export interface MusicProvider {
  submit(input: {
    prompt: string;
    duration: number;
    instrumental: boolean;
    style?: string;
    mood?: string;
    lyrics?: string;
  }): Promise<GenerationResult>;
  getStatus(providerTaskId: string): Promise<GenerationResult>;
}
