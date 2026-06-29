import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.06 — Upload State Machine */
export const UploadState = {
  INIT: "INIT",
  UPLOADING: "UPLOADING",
  MERGING: "MERGING",
  VERIFY: "VERIFY",
  COMPLETE: "COMPLETE",
  RETRY: "RETRY"
} as const;

export type UploadStateValue = (typeof UploadState)[keyof typeof UploadState];

export const UploadEvent = {
  START: "START",
  CHUNK_DONE: "CHUNK_DONE",
  MERGE_DONE: "MERGE_DONE",
  VERIFY_OK: "VERIFY_OK",
  FAIL: "FAIL",
  RETRY: "RETRY"
} as const;

export type UploadEventValue = (typeof UploadEvent)[keyof typeof UploadEvent];

export const uploadStateMachine = createStateMachine<UploadStateValue, UploadEventValue>({
  START: { from: [UploadState.INIT, UploadState.RETRY], to: UploadState.UPLOADING },
  CHUNK_DONE: { from: [UploadState.UPLOADING], to: UploadState.MERGING },
  MERGE_DONE: { from: [UploadState.MERGING], to: UploadState.VERIFY },
  VERIFY_OK: { from: [UploadState.VERIFY], to: UploadState.COMPLETE },
  FAIL: { from: [UploadState.UPLOADING, UploadState.MERGING, UploadState.VERIFY], to: UploadState.RETRY },
  RETRY: { from: [UploadState.RETRY], to: UploadState.UPLOADING }
});
