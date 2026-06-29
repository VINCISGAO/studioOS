import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.07 — AI Job State Machine */
export const AiJobState = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  VALIDATING: "VALIDATING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  RETRYING: "RETRYING",
  DEAD: "DEAD"
} as const;

export type AiJobStateValue = (typeof AiJobState)[keyof typeof AiJobState];

export const AiJobEvent = {
  START: "START",
  COMPLETE: "COMPLETE",
  VALIDATE_OK: "VALIDATE_OK",
  FAIL: "FAIL",
  RETRY: "RETRY",
  ABORT: "ABORT"
} as const;

export type AiJobEventValue = (typeof AiJobEvent)[keyof typeof AiJobEvent];

export const aiJobStateMachine = createStateMachine<AiJobStateValue, AiJobEventValue>({
  START: { from: [AiJobState.QUEUED, AiJobState.RETRYING], to: AiJobState.RUNNING },
  COMPLETE: { from: [AiJobState.RUNNING], to: AiJobState.VALIDATING },
  VALIDATE_OK: { from: [AiJobState.VALIDATING], to: AiJobState.SUCCESS },
  FAIL: { from: [AiJobState.RUNNING, AiJobState.VALIDATING], to: AiJobState.FAILED },
  RETRY: { from: [AiJobState.FAILED], to: AiJobState.RETRYING },
  ABORT: { from: [AiJobState.FAILED, AiJobState.RETRYING], to: AiJobState.DEAD }
});

export const MAX_AI_RETRIES = 2;
