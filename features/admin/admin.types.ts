export type AdminOverviewStats = {
  campaignCount: number;
  activeCampaignCount: number;
  openDisputeCount: number;
  escrowHeldTotal: number;
  userCount: number;
  creatorCount: number;
  brandCount: number;
};

export type AdminDisputeView = {
  id: string;
  campaignId: string;
  campaignTitle: string;
  brandName: string | null;
  openedBy: string;
  reason: string;
  status: string;
  adminId: string | null;
  result: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAuditLogView = {
  id: string;
  campaignId: string;
  campaignTitle: string | null;
  userId: string | null;
  userEmail: string | null;
  action: string;
  ip: string | null;
  device: string | null;
  metadata: unknown;
  createdAt: string;
};

export type FeatureFlagView = {
  id: string;
  key: string;
  enabled: boolean;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type ApiRateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  routes?: Record<string, { maxRequests: number; windowMs?: number }>;
};
