export type AdminOverviewKpis = {
  gmv: number;
  platformRevenue: number;
  platformFees: number;
  escrowHeld: number;
  settlementPending: number;
  pendingWithdrawals: number;
  disputesOpen: number;
  activeCampaigns: number;
};

export type AdminOverviewTodos = {
  pendingReview: number;
  pendingSettlement: number;
  pendingWithdrawals: number;
  disputes: number;
  failedNotifications: number;
};

export type AdminOverviewActivityItem = {
  id: string;
  action: string;
  labelEn: string;
  labelZh: string;
  campaignId: string;
  campaignTitle: string | null;
  userEmail: string | null;
  createdAt: string;
};

export type AdminOverviewCampaignRow = {
  id: string;
  title: string;
  brandName: string | null;
  creatorName: string | null;
  budget: number;
  currency: string;
  status: string;
  updatedAt: string;
};

export type AdminOverviewStatusBucket = {
  status: string;
  count: number;
};

export type GmvTrendPeriod = "day" | "week" | "month";

export type AdminOverviewGmvTrendPoint = {
  date: string;
  gmv: number;
  escrow: number;
  revenue: number;
};

export type AdminOverviewGmvTrendSeries = {
  day: AdminOverviewGmvTrendPoint[];
  week: AdminOverviewGmvTrendPoint[];
  month: AdminOverviewGmvTrendPoint[];
};

import type { AdminBindingStats } from "@/lib/studioos/admin-metrics";

export type AdminOverviewPageData = {
  kpis: AdminOverviewKpis;
  todos: AdminOverviewTodos;
  recentActivity: AdminOverviewActivityItem[];
  latestCampaigns: AdminOverviewCampaignRow[];
  statusDistribution: AdminOverviewStatusBucket[];
  gmvTrend: AdminOverviewGmvTrendSeries;
  bindingStats: AdminBindingStats;
};
