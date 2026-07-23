import type { Prisma } from "@prisma/client";

export type VideoGenerationCreateInput = {
  projectId: string;
  nodeId: string;
  prompt: string;
  model: string;
  idempotencyKey: string;
  parameters: Record<string, unknown>;
};

export type VideoGenerationJobRecord = {
  id: string;
  nodeId: string | null;
  type: "VIDEO";
  status: "QUEUED" | "SUBMITTING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  progress: number;
  outputAssetId: string | null;
  errorMessage: string | null;
  estimatedCredits: number;
  provider: string;
};

export type VideoGenerationCreateResult = {
  job: VideoGenerationJobRecord;
  chargedCredits: number;
};

export type VideoOrchestratorJob = {
  id: string;
  type: "VIDEO";
  provider: string;
  model: string;
  prompt: string;
  input: unknown;
  nodeId: string | null;
  creativeProjectId: string;
  estimatedCredits: number;
};

export type VideoOrchestratorProgressWriter = {
  markProcessing(input: { taskId: string; progress: number }): Promise<void>;
  markPollComplete(): Promise<void>;
  markSucceeded(input: { outputAssetId: string; actualCredits: number }): Promise<void>;
  markFailed(input: { errorCode: string; errorMessage: string }): Promise<void>;
};

export type VideoOrchestratorStorageWriter = {
  saveGeneratedVideo(input: {
    projectId: string;
    buffer: Buffer;
    mimeType: string;
    fileName: string;
    metadata: Record<string, unknown>;
  }): Promise<{ id: string }>;
};

export type VideoOrchestratorContext = {
  progress: VideoOrchestratorProgressWriter;
  storage: VideoOrchestratorStorageWriter;
};

export type VideoGenerationPayload = Prisma.InputJsonValue;
