import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.10 — Invitation State Machine */
export const InvitationState = {
  SENT: "SENT",
  VIEWED: "VIEWED",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  COUNTER: "COUNTER",
  EXPIRED: "EXPIRED"
} as const;

export type InvitationStateValue = (typeof InvitationState)[keyof typeof InvitationState];

export const InvitationEvent = {
  VIEW: "VIEW",
  ACCEPT: "ACCEPT",
  DECLINE: "DECLINE",
  COUNTER: "COUNTER",
  EXPIRE: "EXPIRE"
} as const;

export type InvitationEventValue = (typeof InvitationEvent)[keyof typeof InvitationEvent];

export const invitationStateMachine = createStateMachine<InvitationStateValue, InvitationEventValue>({
  VIEW: { from: [InvitationState.SENT], to: InvitationState.VIEWED },
  ACCEPT: { from: [InvitationState.SENT, InvitationState.VIEWED, InvitationState.COUNTER], to: InvitationState.ACCEPTED },
  DECLINE: { from: [InvitationState.SENT, InvitationState.VIEWED], to: InvitationState.DECLINED },
  COUNTER: { from: [InvitationState.SENT, InvitationState.VIEWED], to: InvitationState.COUNTER },
  EXPIRE: { from: [InvitationState.SENT, InvitationState.VIEWED, InvitationState.COUNTER], to: InvitationState.EXPIRED }
});

export const INVITATION_EXPIRY_HOURS = 24;
