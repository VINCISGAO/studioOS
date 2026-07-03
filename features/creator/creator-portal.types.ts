import type { InvitationDeclineFeedback } from "@/features/matching/invitation-decline-feedback";

export type CreatorPortalInvitationView = {
  id: string;
  campaignId: string;
  title: string;
  brandName: string;
  budget: number;
  currency: string;
  deadline: string;
  platform: string | null;
  matchScore: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  declineFeedback?: InvitationDeclineFeedback;
};

export type CreatorPortalCampaignView = {
  id: string;
  title: string;
  status: string;
  budget: number;
  currency: string;
  deadline: string;
  platform: string | null;
  reviewRound: number;
  legacyProjectId: string | null;
};

export type CreatorPortalStats = {
  pendingInvitations: number;
  activeOrders: number;
  inReview: number;
  completed: number;
  revenue: number;
};

export type CreatorPortalDashboard = {
  invitations: CreatorPortalInvitationView[];
  campaigns: CreatorPortalCampaignView[];
  stats: CreatorPortalStats;
};
