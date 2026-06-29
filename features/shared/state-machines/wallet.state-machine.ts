import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.09 — Wallet State Machine */
export const WalletState = {
  PENDING: "PENDING",
  AVAILABLE: "AVAILABLE",
  WITHDRAW_REQUEST: "WITHDRAW_REQUEST",
  PROCESSING: "PROCESSING",
  PAID: "PAID"
} as const;

export type WalletStateValue = (typeof WalletState)[keyof typeof WalletState];

export const WalletEvent = {
  RELEASE: "RELEASE",
  REQUEST_WITHDRAW: "REQUEST_WITHDRAW",
  PROCESS: "PROCESS",
  COMPLETE: "COMPLETE",
  ROLLBACK: "ROLLBACK"
} as const;

export type WalletEventValue = (typeof WalletEvent)[keyof typeof WalletEvent];

export const walletStateMachine = createStateMachine<WalletStateValue, WalletEventValue>({
  RELEASE: { from: [WalletState.PENDING], to: WalletState.AVAILABLE },
  REQUEST_WITHDRAW: { from: [WalletState.AVAILABLE], to: WalletState.WITHDRAW_REQUEST },
  PROCESS: { from: [WalletState.WITHDRAW_REQUEST], to: WalletState.PROCESSING },
  COMPLETE: { from: [WalletState.PROCESSING], to: WalletState.PAID },
  ROLLBACK: { from: [WalletState.PROCESSING, WalletState.WITHDRAW_REQUEST], to: WalletState.AVAILABLE }
});
