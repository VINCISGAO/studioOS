export type BrandPortalCampaignView = {
  id: string;
  title: string;
  status: string;
  budget: number;
  currency: string;
  deadline: string;
  creatorId: string | null;
  reviewRound: number;
  legacyProjectId: string | null;
};

export type BrandPortalEscrowView = {
  campaignId: string;
  campaignTitle: string;
  status: string;
  amount: number;
  releasedAmount: number;
  remainingAmount: number;
  currency: string;
  creatorId: string;
};

export type BrandPortalStats = {
  totalProjects: number;
  draftCount: number;
  activeCount: number;
  awaitingReview: number;
  escrowHeld: number;
  monthSpend: number;
};

export type BrandPortalDashboard = {
  campaigns: BrandPortalCampaignView[];
  escrows: BrandPortalEscrowView[];
  stats: BrandPortalStats;
};
