import { createStateMachine } from "@/lib/core/state-machine";

/** Derived settlement lifecycle — persisted via Campaign + Escrow + OrderCommission. */
export const SettlementState = {
  BLOCKED: "BLOCKED",
  READY: "READY",
  RELEASED: "RELEASED",
  COMPLETED: "COMPLETED"
} as const;

export type SettlementStateValue = (typeof SettlementState)[keyof typeof SettlementState];

export const SettlementEvent = {
  RELEASE: "RELEASE",
  COMPLETE: "COMPLETE"
} as const;

export type SettlementEventValue = (typeof SettlementEvent)[keyof typeof SettlementEvent];

export const settlementStateMachine = createStateMachine<SettlementStateValue, SettlementEventValue>({
  RELEASE: { from: [SettlementState.READY], to: SettlementState.RELEASED },
  COMPLETE: { from: [SettlementState.RELEASED], to: SettlementState.COMPLETED }
});
