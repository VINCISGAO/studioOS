import type {
  CreatorAvailability,
  CreatorIdentityType,
  CreatorVerificationStatus
} from "@prisma/client";

export const CREATOR_LIFECYCLE_ENFORCEMENT_FLAG = "creator.lifecycle.enforcement";

export type CreatorEligibilityReason =
  | "VERIFICATION_NOT_APPLIED"
  | "VERIFICATION_PENDING"
  | "VERIFICATION_REJECTED"
  | "VERIFICATION_SUSPENDED"
  | "VERIFICATION_NOT_APPROVED"
  | "CAN_ACCEPT_PROJECTS_DISABLED"
  | "MARKETPLACE_HIDDEN"
  | "USER_NOT_ACTIVE"
  | "USER_DELETED"
  | "AVAILABILITY_VACATION"
  | "AVAILABILITY_UNAVAILABLE"
  | "DEPOSIT_REQUIRED"
  | "PROFILE_INCOMPLETE"
  | "ORDERS_PAUSED"
  | "ACCOUNT_DELETED";

export type CreatorEligibility = {
  canUseAiTools: boolean;
  canAppearInMarketplace: boolean;
  canReceiveInvitations: boolean;
  canSubmitProposal: boolean;
  canAcceptProject: boolean;
  canPublishPortfolio: boolean;
  reasons: CreatorEligibilityReason[];
};

export type CreatorEligibilityProfileInput = {
  verificationStatus: CreatorVerificationStatus;
  canAcceptProjects: boolean;
  marketplaceVisible: boolean;
  availability: CreatorAvailability;
  identityType: CreatorIdentityType;
  profileCompletedAt: Date | null;
  user: {
    status: string;
    deletedAt: Date | null;
    role?: string;
  };
};

export type CreatorEligibilityLegacyInput = {
  depositPaid: boolean;
  profileCompleted: boolean;
  ordersPaused: boolean;
  accountDeleted: boolean;
  completedOrders: number;
};

export type CreatorTimelineEventKind =
  | "REGISTERED"
  | "VERIFICATION_APPLIED"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "VERIFICATION_SUSPENDED"
  | "VERIFICATION_RESTORED"
  | "MARKETPLACE_ENABLED"
  | "MARKETPLACE_DISABLED"
  | "PROJECT_ACCESS_ENABLED"
  | "PROJECT_ACCESS_DISABLED";

export type CreatorTimelineEvent = {
  at: string;
  kind: CreatorTimelineEventKind;
  label: string;
  adminId?: string | null;
  reason?: string | null;
  snapshot?: unknown;
};

export type CreatorBackfillStrategy = "A" | "B" | "C" | "D";
