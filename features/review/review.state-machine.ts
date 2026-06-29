import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.04 — Review State Machine */
export const ReviewState = {
  WAITING: "WAITING",
  READY: "READY",
  REVIEWING: "REVIEWING",
  REVISION_REQUIRED: "REVISION_REQUIRED",
  APPROVED: "APPROVED",
  LOCKED: "LOCKED"
} as const;

export type ReviewStateValue = (typeof ReviewState)[keyof typeof ReviewState];

export const ReviewEvent = {
  VERSION_READY: "VERSION_READY",
  START_REVIEW: "START_REVIEW",
  REQUEST_REVISION: "REQUEST_REVISION",
  RESUBMIT: "RESUBMIT",
  APPROVE: "APPROVE",
  LOCK: "LOCK"
} as const;

export type ReviewEventValue = (typeof ReviewEvent)[keyof typeof ReviewEvent];

export const reviewStateMachine = createStateMachine<ReviewStateValue, ReviewEventValue>({
  VERSION_READY: { from: [ReviewState.WAITING, ReviewState.REVISION_REQUIRED], to: ReviewState.READY },
  START_REVIEW: { from: [ReviewState.READY, ReviewState.REVIEWING], to: ReviewState.REVIEWING },
  REQUEST_REVISION: { from: [ReviewState.REVIEWING], to: ReviewState.REVISION_REQUIRED },
  RESUBMIT: { from: [ReviewState.REVISION_REQUIRED], to: ReviewState.WAITING },
  APPROVE: { from: [ReviewState.REVIEWING], to: ReviewState.APPROVED },
  LOCK: { from: [ReviewState.APPROVED], to: ReviewState.LOCKED }
});

/** Business rule: max 3 revision rounds — admin intervention after */
export const MAX_REVIEW_ROUNDS = 3;
