import { adminDashboardRepository } from "@/features/admin/dashboard/admin-dashboard.repository";
import type { AdminOverviewPageData, AdminOverviewActivityItem } from "@/features/admin/dashboard/admin-dashboard.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { adminActivityLabel } from "@/lib/studioos/admin-i18n";

function dedupeRecentActivity(items: AdminOverviewActivityItem[]) {
  const seen = new Set<string>();
  const deduped: AdminOverviewActivityItem[] = [];
  for (const item of items) {
    const key = `${item.action}:${item.campaignId ?? "none"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= 8) break;
  }
  return deduped;
}

export type AdminDashboardMetrics = {
  gmv: number;
  revenue: number;
  platformFees: number;
  completedCampaigns: number;
  avgReviewHours: number;
  avgSettlementHours: number;
  walletAvailable: number;
  walletPending: number;
  walletEarned: number;
  pendingWithdrawals: number;
  topBrands: Array<{ id: string; name: string; count: number }>;
  topCreators: Array<{ id: string; name: string; count: number }>;
};

function emptyOverviewPage(): AdminOverviewPageData {
  return {
    kpis: {
      gmv: 0,
      platformRevenue: 0,
      platformFees: 0,
      escrowHeld: 0,
      settlementPending: 0,
      pendingWithdrawals: 0,
      disputesOpen: 0,
      activeCampaigns: 0
    },
    todos: {
      pendingReview: 0,
      pendingSettlement: 0,
      pendingWithdrawals: 0,
      disputes: 0,
      failedNotifications: 0
    },
    recentActivity: [],
    latestCampaigns: [],
    statusDistribution: [],
    gmvTrend: { day: [], week: [], month: [] },
    bindingStats: {
      brandCount: 0,
      creatorCount: 0,
      campaignCount: 0,
      linkedCampaigns: 0,
      escrowFundedCampaigns: 0,
      openDisputes: 0
    }
  };
}

export class AdminDashboardService {
  async getOverviewPage(user: AuthUser): Promise<AdminOverviewPageData> {
    PermissionService.assert(user, "admin.overview.read");
    const page = await adminDashboardRepository.getOverviewPage();
    if (!page) return emptyOverviewPage();

    return {
      ...page,
      recentActivity: dedupeRecentActivity(
        page.recentActivity.map((item) => ({
          ...item,
          labelEn: adminActivityLabel(item.action, "en"),
          labelZh: adminActivityLabel(item.action, "zh")
        }))
      )
    };
  }

  async getMetrics(user: AuthUser): Promise<AdminDashboardMetrics> {
    PermissionService.assert(user, "admin.overview.read");
    const metrics = await adminDashboardRepository.getMetrics();
    if (!metrics) {
      return {
        gmv: 0,
        revenue: 0,
        platformFees: 0,
        completedCampaigns: 0,
        avgReviewHours: 0,
        avgSettlementHours: 0,
        walletAvailable: 0,
        walletPending: 0,
        walletEarned: 0,
        pendingWithdrawals: 0,
        topBrands: [],
        topCreators: []
      };
    }
    return metrics;
  }
}

export const adminDashboardService = new AdminDashboardService();
