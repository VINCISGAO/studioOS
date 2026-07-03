import { createStateMachine } from "@/lib/core/state-machine";

/** Vol 18 Ch.02–03 — Campaign State Machine */
export const CampaignState = {
  DRAFT: "DRAFT",
  AI_PROCESSING: "AI_PROCESSING",
  CREATIVE_READY: "CREATIVE_READY",
  CREATIVE_APPROVED: "CREATIVE_APPROVED",
  MATCHING: "MATCHING",
  INVITATION_SENT: "INVITATION_SENT",
  CREATOR_ACCEPTED: "CREATOR_ACCEPTED",
  ESCROW_PENDING: "ESCROW_PENDING",
  ESCROW_FUNDED: "ESCROW_FUNDED",
  PRODUCING: "PRODUCING",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  MASTER_UPLOADED: "MASTER_UPLOADED",
  SETTLEMENT: "SETTLEMENT",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

export type CampaignStateValue = (typeof CampaignState)[keyof typeof CampaignState];

export const CampaignEvent = {
  START_AI: "START_AI",
  AI_SUCCESS: "AI_SUCCESS",
  AI_FAILED: "AI_FAILED",
  APPROVE_CREATIVE: "APPROVE_CREATIVE",
  /** Legacy alias kept for callers; publish requires Creative Direction approval. */
  PUBLISH: "PUBLISH",
  START_MATCHING: "START_MATCHING",
  SEND_INVITATION: "SEND_INVITATION",
  CREATOR_ACCEPT: "CREATOR_ACCEPT",
  START_PAYMENT: "START_PAYMENT",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  START_PRODUCTION: "START_PRODUCTION",
  VERSION_UPLOAD: "VERSION_UPLOAD",
  REQUEST_REVISION: "REQUEST_REVISION",
  CREATOR_REVERT_UPLOAD: "CREATOR_REVERT_UPLOAD",
  APPROVE: "APPROVE",
  MASTER_UPLOAD: "MASTER_UPLOAD",
  RELEASE_PAYMENT: "RELEASE_PAYMENT",
  COMPLETE: "COMPLETE",
  CANCEL: "CANCEL"
} as const;

export type CampaignEventValue = (typeof CampaignEvent)[keyof typeof CampaignEvent];

export const campaignStateMachine = createStateMachine<CampaignStateValue, CampaignEventValue>({
  START_AI: { from: [CampaignState.DRAFT], to: CampaignState.AI_PROCESSING },
  AI_SUCCESS: { from: [CampaignState.AI_PROCESSING], to: CampaignState.CREATIVE_READY },
  AI_FAILED: { from: [CampaignState.AI_PROCESSING], to: CampaignState.DRAFT },
  APPROVE_CREATIVE: { from: [CampaignState.CREATIVE_READY], to: CampaignState.CREATIVE_APPROVED },
  PUBLISH: { from: [CampaignState.CREATIVE_APPROVED], to: CampaignState.MATCHING },
  START_MATCHING: { from: [CampaignState.CREATIVE_APPROVED], to: CampaignState.MATCHING },
  SEND_INVITATION: { from: [CampaignState.MATCHING], to: CampaignState.INVITATION_SENT },
  CREATOR_ACCEPT: { from: [CampaignState.MATCHING, CampaignState.INVITATION_SENT], to: CampaignState.CREATOR_ACCEPTED },
  START_PAYMENT: { from: [CampaignState.CREATOR_ACCEPTED], to: CampaignState.ESCROW_PENDING },
  PAYMENT_SUCCESS: { from: [CampaignState.ESCROW_PENDING, CampaignState.CREATOR_ACCEPTED], to: CampaignState.ESCROW_FUNDED },
  START_PRODUCTION: { from: [CampaignState.ESCROW_FUNDED], to: CampaignState.PRODUCING },
  VERSION_UPLOAD: { from: [CampaignState.PRODUCING, CampaignState.UNDER_REVIEW], to: CampaignState.UNDER_REVIEW },
  /** Brand has not started annotating — creator may revert and replace the current draft. */
  REQUEST_REVISION: { from: [CampaignState.UNDER_REVIEW], to: CampaignState.PRODUCING },
  CREATOR_REVERT_UPLOAD: { from: [CampaignState.UNDER_REVIEW], to: CampaignState.PRODUCING },
  APPROVE: { from: [CampaignState.UNDER_REVIEW], to: CampaignState.APPROVED },
  MASTER_UPLOAD: { from: [CampaignState.APPROVED], to: CampaignState.MASTER_UPLOADED },
  RELEASE_PAYMENT: { from: [CampaignState.MASTER_UPLOADED], to: CampaignState.SETTLEMENT },
  COMPLETE: { from: [CampaignState.SETTLEMENT], to: CampaignState.COMPLETED },
  CANCEL: {
    from: [
      CampaignState.DRAFT,
      CampaignState.AI_PROCESSING,
      CampaignState.CREATIVE_READY,
      CampaignState.CREATIVE_APPROVED,
      CampaignState.MATCHING,
      CampaignState.INVITATION_SENT,
      CampaignState.CREATOR_ACCEPTED,
      CampaignState.ESCROW_PENDING
    ],
    to: CampaignState.CANCELLED
  }
});
