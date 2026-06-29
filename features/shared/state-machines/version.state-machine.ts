import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.05 — Version State Machine */
export const VersionState = {
  UPLOADING: "UPLOADING",
  PROCESSING: "PROCESSING",
  TRANSCODING: "TRANSCODING",
  GENERATING_HLS: "GENERATING_HLS",
  AI_ANALYZING: "AI_ANALYZING",
  READY: "READY",
  REVIEWING: "REVIEWING",
  APPROVED: "APPROVED",
  MASTER: "MASTER",
  FAILED: "FAILED"
} as const;

export type VersionStateValue = (typeof VersionState)[keyof typeof VersionState];

export const VersionEvent = {
  UPLOAD_COMPLETE: "UPLOAD_COMPLETE",
  PROCESS_DONE: "PROCESS_DONE",
  TRANSCODE_DONE: "TRANSCODE_DONE",
  HLS_DONE: "HLS_DONE",
  AI_DONE: "AI_DONE",
  START_REVIEW: "START_REVIEW",
  APPROVE: "APPROVE",
  PROMOTE_MASTER: "PROMOTE_MASTER",
  FAIL: "FAIL",
  RETRY: "RETRY"
} as const;

export type VersionEventValue = (typeof VersionEvent)[keyof typeof VersionEvent];

export const versionStateMachine = createStateMachine<VersionStateValue, VersionEventValue>({
  UPLOAD_COMPLETE: { from: [VersionState.UPLOADING], to: VersionState.PROCESSING },
  PROCESS_DONE: { from: [VersionState.PROCESSING], to: VersionState.TRANSCODING },
  TRANSCODE_DONE: { from: [VersionState.TRANSCODING], to: VersionState.GENERATING_HLS },
  HLS_DONE: { from: [VersionState.GENERATING_HLS], to: VersionState.AI_ANALYZING },
  AI_DONE: { from: [VersionState.AI_ANALYZING], to: VersionState.READY },
  START_REVIEW: { from: [VersionState.READY], to: VersionState.REVIEWING },
  APPROVE: { from: [VersionState.REVIEWING], to: VersionState.APPROVED },
  PROMOTE_MASTER: { from: [VersionState.APPROVED], to: VersionState.MASTER },
  FAIL: {
    from: [
      VersionState.UPLOADING,
      VersionState.PROCESSING,
      VersionState.TRANSCODING,
      VersionState.GENERATING_HLS,
      VersionState.AI_ANALYZING
    ],
    to: VersionState.FAILED
  },
  RETRY: { from: [VersionState.FAILED], to: VersionState.UPLOADING }
});

export const MAX_VERSION_RETRIES = 3;
