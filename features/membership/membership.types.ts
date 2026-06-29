import type { CreatorMembershipPlanType } from "@prisma/client";

export type MembershipBenefit =
  | "receive_orders"
  | "verified_badge"
  | "priority_ranking"
  | "priority_invitations"
  | "faster_payout"
  | "ai_assistant"
  | "ai_translation"
  | "ai_contract"
  | "analytics_dashboard"
  | "priority_support"
  | "normal_ranking"
  | "normal_payout"
  | "normal_support";

export type CommissionBreakdown = {
  orderAmount: number;
  currency: string;
  clientServiceFeePercentage: number;
  clientServiceFeeAmount: number;
  creatorCommissionPercentage: number;
  creatorCommissionAmount: number;
  creatorPayoutAmount: number;
  platformTotalRevenue: number;
  creatorMembershipType: CreatorMembershipPlanType;
};

export type CommissionSnapshotInput = {
  orderAmount: number;
  currency?: string;
  creatorCommissionPercentage: number;
  clientServiceFeePercentage: number;
  clientServiceFeeEnabled: boolean;
  creatorMembershipType: CreatorMembershipPlanType;
};

export type ActiveCommissionRule = {
  id: string;
  name: string;
  clientServiceFeePercentage: number;
  defaultCreatorCommissionPercentage: number;
  verifiedCreatorCommissionPercentage: number;
  upgradeRevenueThreshold: number;
  upgradeModalEnabled: boolean;
  clientServiceFeeEnabled: boolean;
};

export type MembershipPlanView = {
  id: string;
  slug: string;
  name: string;
  planType: CreatorMembershipPlanType;
  annualFee: number;
  creatorCommissionPercentage: number;
  membershipDurationDays: number;
  benefits: MembershipBenefit[];
  stripePriceId: string | null;
  isActive: boolean;
};

export type CreatorMembershipStatusView = {
  creatorId: string;
  planType: CreatorMembershipPlanType;
  plan: MembershipPlanView;
  isVerified: boolean;
  membership: {
    id: string;
    status: string;
    startedAt: string;
    expiresAt: string | null;
  } | null;
  commissionRate: number;
  earnings: {
    totalSettledRevenue: number;
    totalPendingRevenue: number;
    totalWithdrawn: number;
    totalCreatorPayout: number;
    upgradeThreshold: number;
    progressPercent: number;
    shouldShowUpgradeModal: boolean;
  };
  benefits: MembershipBenefit[];
};

export type UpgradeEligibility = {
  eligible: boolean;
  reason?: string;
  threshold: number;
  settledRevenue: number;
  modalEnabled: boolean;
  declined: boolean;
};
