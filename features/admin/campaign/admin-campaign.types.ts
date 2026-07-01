import type { SettlementStateValue } from "@/features/settlement/settlement.state-machine";

export type AdminCampaignListFilters = {
  search?: string;
  status?: string;
  brandSearch?: string;
  creatorSearch?: string;
  escrowStatus?: string;
  deliveryStatus?: string;
  settlementState?: string;
  reviewRound?: number;
  limit?: number;
  offset?: number;
};

export type AdminCampaignListItem = {
  id: string;
  title: string;
  status: string;
  budget: number;
  currency: string;
  reviewRound: number;
  legacyProjectId: string | null;
  brandId: string;
  brandName: string | null;
  brandEmail: string | null;
  creatorId: string | null;
  creatorName: string | null;
  escrowStatus: string | null;
  deliveryStatus: string | null;
  settlementState: SettlementStateValue | "DISPUTE";
  updatedAt: string;
};

export type AdminCampaignVersionView = {
  id: string;
  versionNumber: number;
  status: string;
  reviewStatus: string;
  reviewRound: number;
  fileName: string | null;
  createdAt: string;
};

export type AdminCampaignCommentView = {
  id: string;
  versionNumber: number;
  userEmail: string | null;
  comment: string;
  timeSeconds: number;
  resolved: boolean;
  createdAt: string;
};

export type AdminCampaignDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  budget: number;
  currency: string;
  deadline: string;
  reviewRound: number;
  currentVersion: number;
  legacyProjectId: string | null;
  brand: { id: string; email: string | null; name: string | null };
  creator: { id: string; email: string | null; name: string | null } | null;
  escrow: {
    id: string;
    status: string;
    amount: number;
    releasedAmount: number;
    remainingAmount: number;
    paymentStatus: string;
    creatorPayoutStatus: string | null;
    paidAt: string | null;
    payoutPaidAt: string | null;
  } | null;
  delivery: {
    id: string;
    status: string;
    deliveredAt: string;
    acceptedAt: string | null;
    downloadUrl: string;
  } | null;
  settlementPreview: {
    orderAmount: number;
    creatorPayoutAmount: number;
    creatorCommissionAmount: number;
    platformTotalRevenue: number;
    currency: string;
  } | null;
  settlementState: SettlementStateValue | "DISPUTE";
  wallet: {
    availableBalance: number;
    pendingBalance: number;
    totalEarned: number;
    totalWithdraw: number;
  } | null;
  versions: AdminCampaignVersionView[];
  comments: AdminCampaignCommentView[];
  ledgerEntries: Array<{
    id: string;
    entryType: string;
    direction: string;
    amount: number;
    assetCode: string;
    description: string | null;
    createdAt: string;
  }>;
  activityLogs: Array<{
    id: string;
    action: string;
    userEmail: string | null;
    metadata: unknown;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    content: string;
    isSent: boolean;
    isRead: boolean;
    createdAt: string;
  }>;
  openDisputes: number;
  createdAt: string;
  updatedAt: string;
};
