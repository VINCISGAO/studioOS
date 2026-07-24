import type { GenerationType } from "@prisma/client";

export type GenerationConcurrencyCounts = {
  userRunningTotal: number;
  userQueuedTotal: number;
  userRunningByType: Record<GenerationType, number>;
  userQueuedByType: Record<GenerationType, number>;
  projectRunningTotal: number;
  projectQueuedTotal: number;
  providerRunningTotal: number;
  providerQueuedTotal: number;
};

export type GenerationCreateSlotInput = {
  userId: string;
  projectId: string;
  type: GenerationType;
  provider: string;
};

export type GenerationDispatchInput = GenerationCreateSlotInput & {
  jobId: string;
};

export type GenerationDispatchDecision = {
  allowed: boolean;
  reason?: "USER_RUNNING" | "USER_QUEUED" | "TYPE_RUNNING" | "TYPE_QUEUED" | "PROJECT" | "PROVIDER_RUNNING" | "PROVIDER_QUEUED";
};
