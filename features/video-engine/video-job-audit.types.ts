import type { GenerationStatus } from "@prisma/client";

export const VIDEO_ENGINE_AUDIT_WRITE_FAILED = "VIDEO_ENGINE_AUDIT_WRITE_FAILED";

export const VIDEO_JOB_EVENT_TYPES = {
  JOB_CREATED: "JOB_CREATED",
  JOB_CLAIMED: "JOB_CLAIMED",
  PROVIDER_SUBMITTED: "PROVIDER_SUBMITTED",
  PROVIDER_POLL: "PROVIDER_POLL",
  ASSET_DOWNLOADING: "ASSET_DOWNLOADING",
  STORAGE_SAVED: "STORAGE_SAVED",
  STALE_JOB_RECOVERED: "STALE_JOB_RECOVERED",
  JOB_SUCCEEDED: "JOB_SUCCEEDED",
  JOB_FAILED: "JOB_FAILED"
} as const;

export type VideoJobEventType = (typeof VIDEO_JOB_EVENT_TYPES)[keyof typeof VIDEO_JOB_EVENT_TYPES];

export const REQUIRED_VIDEO_JOB_EVENT_TYPES = new Set<VideoJobEventType>([
  VIDEO_JOB_EVENT_TYPES.JOB_CREATED,
  VIDEO_JOB_EVENT_TYPES.JOB_CLAIMED,
  VIDEO_JOB_EVENT_TYPES.JOB_SUCCEEDED,
  VIDEO_JOB_EVENT_TYPES.JOB_FAILED
]);

export const BEST_EFFORT_VIDEO_JOB_EVENT_TYPES = new Set<VideoJobEventType>([
  VIDEO_JOB_EVENT_TYPES.PROVIDER_SUBMITTED,
  VIDEO_JOB_EVENT_TYPES.PROVIDER_POLL,
  VIDEO_JOB_EVENT_TYPES.ASSET_DOWNLOADING,
  VIDEO_JOB_EVENT_TYPES.STORAGE_SAVED,
  VIDEO_JOB_EVENT_TYPES.STALE_JOB_RECOVERED
]);

export type VideoJobAuditEventInput = {
  generationJobId: string;
  eventType: VideoJobEventType;
  fromStatus?: GenerationStatus | null;
  toStatus?: GenerationStatus | null;
  progress?: number | null;
  payload?: Record<string, unknown> | null;
};

export type VideoRoutingDecisionInput = {
  generationJobId: string;
  requestedModel: string;
  resolvedProvider: string | null;
  resolvedModel: string | null;
  reason: string;
  metadata?: Record<string, unknown> | null;
};

export type VideoPromptVersionInput = {
  generationJobId: string;
  version: number;
  source: "USER";
  prompt: string;
  providerPrompt?: string | null;
};

export type VideoJobAttemptRecord = {
  id: string;
  generationJobId: string;
  attemptNumber: number;
  provider: string;
  providerTaskId: string | null;
  status: string;
  errorCode: string | null;
  startedAt: Date;
  finishedAt: Date | null;
};
