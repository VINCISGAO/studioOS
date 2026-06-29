import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.11 — Notification State Machine */
export const NotificationState = {
  CREATED: "CREATED",
  QUEUED: "QUEUED",
  SENDING: "SENDING",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
  RETRY: "RETRY"
} as const;

export type NotificationStateValue = (typeof NotificationState)[keyof typeof NotificationState];

export const NotificationEvent = {
  ENQUEUE: "ENQUEUE",
  START_SEND: "START_SEND",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
  FAIL: "FAIL",
  RETRY: "RETRY"
} as const;

export type NotificationEventValue = (typeof NotificationEvent)[keyof typeof NotificationEvent];

export const notificationStateMachine = createStateMachine<NotificationStateValue, NotificationEventValue>({
  ENQUEUE: { from: [NotificationState.CREATED], to: NotificationState.QUEUED },
  START_SEND: { from: [NotificationState.QUEUED, NotificationState.RETRY], to: NotificationState.SENDING },
  SENT: { from: [NotificationState.SENDING], to: NotificationState.SENT },
  DELIVERED: { from: [NotificationState.SENT], to: NotificationState.DELIVERED },
  READ: { from: [NotificationState.DELIVERED, NotificationState.SENT], to: NotificationState.READ },
  FAIL: { from: [NotificationState.SENDING], to: NotificationState.RETRY },
  RETRY: { from: [NotificationState.RETRY], to: NotificationState.QUEUED }
});
