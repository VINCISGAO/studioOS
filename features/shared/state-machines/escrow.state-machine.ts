import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.08 — Escrow State Machine */
export const EscrowState = {
  CREATED: "CREATED",
  PAYING: "PAYING",
  HELD: "HELD",
  PARTIAL_RELEASE: "PARTIAL_RELEASE",
  FULL_RELEASE: "FULL_RELEASE",
  CLOSED: "CLOSED",
  REFUND: "REFUND",
  DISPUTE: "DISPUTE"
} as const;

export type EscrowStateValue = (typeof EscrowState)[keyof typeof EscrowState];

export const EscrowEvent = {
  START_PAYMENT: "START_PAYMENT",
  PAYMENT_HELD: "PAYMENT_HELD",
  RELEASE_PARTIAL: "RELEASE_PARTIAL",
  RELEASE_FULL: "RELEASE_FULL",
  CLOSE: "CLOSE",
  REFUND: "REFUND",
  OPEN_DISPUTE: "OPEN_DISPUTE"
} as const;

export type EscrowEventValue = (typeof EscrowEvent)[keyof typeof EscrowEvent];

export const escrowStateMachine = createStateMachine<EscrowStateValue, EscrowEventValue>({
  START_PAYMENT: { from: [EscrowState.CREATED], to: EscrowState.PAYING },
  PAYMENT_HELD: { from: [EscrowState.PAYING], to: EscrowState.HELD },
  RELEASE_PARTIAL: { from: [EscrowState.HELD, EscrowState.PARTIAL_RELEASE], to: EscrowState.PARTIAL_RELEASE },
  RELEASE_FULL: { from: [EscrowState.PARTIAL_RELEASE, EscrowState.HELD], to: EscrowState.FULL_RELEASE },
  CLOSE: { from: [EscrowState.FULL_RELEASE], to: EscrowState.CLOSED },
  REFUND: { from: [EscrowState.HELD, EscrowState.PARTIAL_RELEASE], to: EscrowState.REFUND },
  OPEN_DISPUTE: { from: [EscrowState.HELD, EscrowState.PARTIAL_RELEASE], to: EscrowState.DISPUTE }
});
