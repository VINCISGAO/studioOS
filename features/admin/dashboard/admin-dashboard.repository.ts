import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { adminWithdrawalRepository } from "@/features/admin/withdrawal/admin-withdrawal.repository";
import type {
  AdminOverviewGmvTrendPoint,
  AdminOverviewGmvTrendSeries,
  AdminOverviewPageData
} from "@/features/admin/dashboard/admin-dashboard.types";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function weekStartKey(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDateKey(d);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function initTrendMap(keys: string[]) {
  const map = new Map<string, { gmv: number; escrow: number; revenue: number }>();
  for (const key of keys) {
    map.set(key, { gmv: 0, escrow: 0, revenue: 0 });
  }
  return map;
}

function addToTrend(
  map: Map<string, { gmv: number; escrow: number; revenue: number }>,
  key: string,
  escrowDelta: number,
  revenueDelta: number
) {
  if (!map.has(key)) return;
  const entry = map.get(key)!;
  entry.escrow += escrowDelta;
  entry.revenue += revenueDelta;
  entry.gmv += escrowDelta;
}

function mapToPoints(map: Map<string, { gmv: number; escrow: number; revenue: number }>): AdminOverviewGmvTrendPoint[] {
  return Array.from(map.entries()).map(([date, values]) => ({
    date,
    gmv: values.gmv,
    escrow: values.escrow,
    revenue: values.revenue
  }));
}

function buildGmvTrendSeries(
  escrowRows: Array<{ amount: unknown; createdAt: Date }>,
  commissionRows: Array<{ platformTotalRevenue: unknown; settledAt: Date }>
): AdminOverviewGmvTrendSeries {
  const daySince = startOfDay(new Date());
  daySince.setDate(daySince.getDate() - 13);

  const dayKeys: string[] = [];
  for (let i = 0; i < 14; i++) {
    const day = new Date(daySince);
    day.setDate(daySince.getDate() + i);
    dayKeys.push(formatDateKey(day));
  }

  const weekKeys: string[] = [];
  const weekAnchor = startOfDay(new Date());
  weekAnchor.setDate(weekAnchor.getDate() - weekAnchor.getDay() + 1);
  for (let i = 7; i >= 0; i--) {
    const week = new Date(weekAnchor);
    week.setDate(weekAnchor.getDate() - i * 7);
    weekKeys.push(weekStartKey(week));
  }

  const monthKeys: string[] = [];
  const monthAnchor = new Date();
  monthAnchor.setDate(1);
  for (let i = 5; i >= 0; i--) {
    const month = new Date(monthAnchor);
    month.setMonth(monthAnchor.getMonth() - i);
    monthKeys.push(monthKey(month));
  }

  const dayMap = initTrendMap(dayKeys);
  const weekMap = initTrendMap(weekKeys);
  const monthMap = initTrendMap(monthKeys);

  for (const row of escrowRows) {
    const amount = Number(row.amount);
    const day = formatDateKey(row.createdAt);
    const week = weekStartKey(row.createdAt);
    const month = monthKey(row.createdAt);
    addToTrend(dayMap, day, amount, 0);
    addToTrend(weekMap, week, amount, 0);
    addToTrend(monthMap, month, amount, 0);
  }

  for (const row of commissionRows) {
    const revenue = Number(row.platformTotalRevenue);
    const day = formatDateKey(row.settledAt);
    const week = weekStartKey(row.settledAt);
    const month = monthKey(row.settledAt);
    addToTrend(dayMap, day, 0, revenue);
    addToTrend(weekMap, week, 0, revenue);
    addToTrend(monthMap, month, 0, revenue);
    if (dayMap.has(day)) dayMap.get(day)!.gmv += revenue;
    if (weekMap.has(week)) weekMap.get(week)!.gmv += revenue;
    if (monthMap.has(month)) monthMap.get(month)!.gmv += revenue;
  }

  return {
    day: mapToPoints(dayMap),
    week: mapToPoints(weekMap),
    month: mapToPoints(monthMap)
  };
}

export class AdminDashboardRepository {
  async getOverviewPage(): Promise<AdminOverviewPageData | null> {
    if (!hasDatabaseUrl()) {
      return null;
    }

    const trendSince = new Date();
    trendSince.setMonth(trendSince.getMonth() - 6);
    trendSince.setHours(0, 0, 0, 0);

    const [
      escrowRows,
      heldEscrows,
      commissionAgg,
      campaignBudgetAgg,
      pendingWithdrawals,
      disputesOpen,
      activeCampaigns,
      pendingReview,
      pendingSettlement,
      failedNotifications,
      recentActivity,
      latestCampaigns,
      statusDistribution,
      trendEscrows,
      trendCommissions
    ] = await Promise.all([
      prisma.escrowPayment.findMany({
        where: { status: { in: ["HELD", "PARTIAL_RELEASE", "FULL_RELEASE", "CLOSED"] } },
        select: { amount: true }
      }),
      prisma.escrowPayment.findMany({
        where: { status: "HELD" },
        select: { remainingAmount: true }
      }),
      prisma.orderCommission.aggregate({
        _sum: { platformTotalRevenue: true, clientServiceFeeAmount: true }
      }),
      prisma.campaign.aggregate({
        where: { deletedAt: null },
        _sum: { budget: true }
      }),
      adminWithdrawalRepository.countPendingRequests(),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "PROCESSING"] } } }),
      prisma.campaign.count({
        where: { deletedAt: null, status: { notIn: ["COMPLETED", "CANCELLED"] } }
      }),
      prisma.campaign.count({ where: { deletedAt: null, status: "UNDER_REVIEW" } }),
      prisma.campaign.count({
        where: {
          deletedAt: null,
          deliveries: { is: { status: "LOCKED" } },
          escrow: { status: "HELD" }
        }
      }),
      prisma.notification.count({ where: { isSent: false } }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          campaign: { select: { id: true, title: true } },
          user: { select: { email: true } }
        }
      }),
      prisma.campaign.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          budget: true,
          currency: true,
          status: true,
          updatedAt: true,
          brand: { select: { fullName: true, brandProfile: { select: { companyName: true } } } },
          creator: { select: { fullName: true, creatorProfile: { select: { displayName: true } } } }
        }
      }),
      prisma.campaign.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } }
      }),
      prisma.escrowPayment.findMany({
        where: { createdAt: { gte: trendSince } },
        select: { amount: true, createdAt: true }
      }),
      prisma.orderCommission.findMany({
        where: { settledAt: { gte: trendSince } },
        select: { platformTotalRevenue: true, settledAt: true }
      })
    ]);

    let gmv = escrowRows.reduce((sum, row) => sum + Number(row.amount), 0);
    if (gmv === 0) {
      gmv = Number(campaignBudgetAgg._sum.budget ?? 0);
    }

    const escrowHeld = heldEscrows.reduce((sum, row) => sum + Number(row.remainingAmount), 0);
    const settlementPending = escrowHeld;

    return {
      kpis: {
        gmv,
        platformRevenue: Number(commissionAgg._sum.platformTotalRevenue ?? 0),
        platformFees: Number(commissionAgg._sum.clientServiceFeeAmount ?? 0),
        escrowHeld,
        settlementPending,
        pendingWithdrawals,
        disputesOpen,
        activeCampaigns
      },
      todos: {
        pendingReview,
        pendingSettlement,
        pendingWithdrawals,
        disputes: disputesOpen,
        failedNotifications
      },
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        labelEn: "",
        labelZh: "",
        campaignId: log.campaignId,
        campaignTitle: log.campaign?.title ?? null,
        userEmail: log.user?.email ?? null,
        createdAt: log.createdAt.toISOString()
      })),
      latestCampaigns: latestCampaigns.map((row) => ({
        id: row.id,
        title: row.title,
        brandName: row.brand.brandProfile?.companyName ?? row.brand.fullName ?? null,
        creatorName: row.creator?.creatorProfile?.displayName ?? row.creator?.fullName ?? null,
        budget: Number(row.budget),
        currency: row.currency,
        status: row.status,
        updatedAt: row.updatedAt.toISOString()
      })),
      statusDistribution: statusDistribution.map((row) => ({
        status: row.status,
        count: row._count.id
      })),
      gmvTrend: buildGmvTrendSeries(trendEscrows, trendCommissions)
    };
  }

  async getMetrics() {
    if (!hasDatabaseUrl()) {
      return null;
    }

    const [
      escrowRows,
      commissionAgg,
      completedCampaigns,
      wallets,
      pendingWithdrawals,
      campaignsForReview,
      topBrands,
      topCreators
    ] = await Promise.all([
      prisma.escrowPayment.findMany({
        where: { status: { in: ["HELD", "PARTIAL_RELEASE", "FULL_RELEASE", "CLOSED"] } },
        select: { amount: true, releasedAmount: true }
      }),
      prisma.orderCommission.aggregate({
        _sum: { platformTotalRevenue: true, clientServiceFeeAmount: true }
      }),
      prisma.campaign.count({ where: { status: "COMPLETED", deletedAt: null } }),
      prisma.wallet.aggregate({
        _sum: { availableBalance: true, pendingBalance: true, totalEarned: true }
      }),
      prisma.transaction.count({ where: { type: "WITHDRAW_REQUEST" } }),
      prisma.campaign.findMany({
        where: { deletedAt: null, status: { in: ["UNDER_REVIEW", "APPROVED", "COMPLETED"] } },
        select: { createdAt: true, updatedAt: true },
        take: 200,
        orderBy: { updatedAt: "desc" }
      }),
      prisma.campaign.groupBy({
        by: ["brandId"],
        where: { deletedAt: null },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5
      }),
      prisma.campaign.groupBy({
        by: ["creatorId"],
        where: { deletedAt: null, creatorId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5
      })
    ]);

    const gmv = escrowRows.reduce((sum, row) => sum + Number(row.amount), 0);
    const brandUsers = await Promise.all(
      topBrands.map(async (b) => {
        const user = await prisma.user.findUnique({
          where: { id: b.brandId },
          select: { fullName: true, email: true, brandProfile: { select: { companyName: true } } }
        });
        return {
          id: b.brandId,
          name: user?.brandProfile?.companyName ?? user?.fullName ?? user?.email ?? b.brandId,
          count: b._count.id
        };
      })
    );
    const creatorUsers = await Promise.all(
      topCreators.map(async (c) => {
        if (!c.creatorId) return null;
        const user = await prisma.user.findUnique({
          where: { id: c.creatorId },
          select: { fullName: true, creatorProfile: { select: { displayName: true } } }
        });
        return {
          id: c.creatorId,
          name: user?.creatorProfile?.displayName ?? user?.fullName ?? c.creatorId,
          count: c._count.id
        };
      })
    );

    const reviewDeltas = campaignsForReview
      .map((c) => (c.updatedAt.getTime() - c.createdAt.getTime()) / 3600000)
      .filter((h) => h > 0);
    const avgReviewHours =
      reviewDeltas.length > 0 ? reviewDeltas.reduce((a, b) => a + b, 0) / reviewDeltas.length : 0;

    const settled = await prisma.orderCommission.findMany({
      select: { settledAt: true, createdAt: true },
      take: 100,
      orderBy: { settledAt: "desc" }
    });
    const settlementDeltas = settled.map((s) => (s.settledAt.getTime() - s.createdAt.getTime()) / 3600000);
    const avgSettlementHours =
      settlementDeltas.length > 0 ? settlementDeltas.reduce((a, b) => a + b, 0) / settlementDeltas.length : 0;

    return {
      gmv,
      revenue: Number(commissionAgg._sum.platformTotalRevenue ?? 0),
      platformFees: Number(commissionAgg._sum.clientServiceFeeAmount ?? 0),
      completedCampaigns,
      avgReviewHours,
      avgSettlementHours,
      walletAvailable: Number(wallets._sum.availableBalance ?? 0),
      walletPending: Number(wallets._sum.pendingBalance ?? 0),
      walletEarned: Number(wallets._sum.totalEarned ?? 0),
      pendingWithdrawals,
      topBrands: brandUsers,
      topCreators: creatorUsers.filter(Boolean) as Array<{ id: string; name: string; count: number }>
    };
  }
}

export const adminDashboardRepository = new AdminDashboardRepository();
