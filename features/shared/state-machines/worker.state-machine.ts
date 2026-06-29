import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.12 — Worker State Machine */
export const WorkerState = {
  WAITING: "WAITING",
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  RETRY: "RETRY",
  DEAD: "DEAD"
} as const;

export type WorkerStateValue = (typeof WorkerState)[keyof typeof WorkerState];

export const WorkerEvent = {
  START: "START",
  COMPLETE: "COMPLETE",
  FAIL: "FAIL",
  RETRY: "RETRY",
  ABORT: "ABORT"
} as const;

export type WorkerEventValue = (typeof WorkerEvent)[keyof typeof WorkerEvent];

export const workerStateMachine = createStateMachine<WorkerStateValue, WorkerEventValue>({
  START: { from: [WorkerState.WAITING, WorkerState.RETRY], to: WorkerState.RUNNING },
  COMPLETE: { from: [WorkerState.RUNNING], to: WorkerState.SUCCESS },
  FAIL: { from: [WorkerState.RUNNING], to: WorkerState.FAILED },
  RETRY: { from: [WorkerState.FAILED], to: WorkerState.RETRY },
  ABORT: { from: [WorkerState.FAILED, WorkerState.RETRY], to: WorkerState.DEAD }
});

export const MAX_WORKER_RETRIES = 3;
