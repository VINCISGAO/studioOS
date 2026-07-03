import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

export type AdminDatabaseOverview = {
  enabled: boolean;
  counts: {
    users: number;
    creators: number;
    brands: number;
    works: number;
    aiConfigs: number;
    conversations: number;
    orders: number;
    campaigns: number;
    attributions: number;
    walletAccounts: number;
    ledgerEntries: number;
    withdrawalRequests: number;
    referralCodes: number;
    referralCommissions: number;
    languages: number;
    languageKeys: number;
    languageTranslations: number;
  };
  recent: {
    users: Array<{ id: string; email: string; role: string; createdAt: string }>;
    campaigns: Array<{ id: string; title: string; status: string; updatedAt: string }>;
    orders: Array<{ id: string; serviceProject: string; status: string; amount: number; createdAt: string }>;
    conversations: Array<{ id: string; channel: string; status: string; updatedAt: string }>;
  };
};

function emptyOverview(): AdminDatabaseOverview {
  return {
    enabled: false,
    counts: {
      users: 0,
      creators: 0,
      brands: 0,
      works: 0,
      aiConfigs: 0,
      conversations: 0,
      orders: 0,
      campaigns: 0,
      attributions: 0,
      walletAccounts: 0,
      ledgerEntries: 0,
      withdrawalRequests: 0,
      referralCodes: 0,
      referralCommissions: 0,
      languages: 0,
      languageKeys: 0,
      languageTranslations: 0
    },
    recent: { users: [], campaigns: [], orders: [], conversations: [] }
  };
}

export class AdminDatabaseService {
  async getOverview(user: AuthUser): Promise<AdminDatabaseOverview> {
    PermissionService.assert(user, "admin.overview.read");
    if (!hasDatabaseUrl()) return emptyOverview();

    const [
      users,
      creators,
      brands,
      works,
      aiConfigs,
      conversations,
      orders,
      campaigns,
      attributions,
      walletAccounts,
      ledgerEntries,
      withdrawalRequests,
      referralCodes,
      referralCommissions,
      languages,
      languageKeys,
      languageTranslations,
      recentUsers,
      recentCampaigns,
      recentOrders,
      recentConversations
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.creatorProfile.count(),
      prisma.brandProfile.count(),
      prisma.creatorPortfolioWork.count({ where: { deletedAt: null } }),
      prisma.creatorAiConfig.count(),
      prisma.conversation.count(),
      prisma.order.count(),
      prisma.campaign.count({ where: { deletedAt: null } }),
      prisma.attribution.count(),
      prisma.walletAccount.count(),
      prisma.ledgerEntry.count(),
      prisma.withdrawalRequest.count(),
      prisma.referralCode.count(),
      prisma.referralCommission.count(),
      prisma.language.count(),
      prisma.languageKey.count(),
      prisma.languageTranslation.count(),
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, email: true, role: true, createdAt: true }
      }),
      prisma.campaign.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, title: true, status: true, updatedAt: true }
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, serviceProject: true, status: true, orderAmount: true, createdAt: true }
      }),
      prisma.conversation.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, channel: true, status: true, updatedAt: true }
      })
    ]);

    return {
      enabled: true,
      counts: {
        users,
        creators,
        brands,
        works,
        aiConfigs,
        conversations,
        orders,
        campaigns,
        attributions,
        walletAccounts,
        ledgerEntries,
        withdrawalRequests,
        referralCodes,
        referralCommissions,
        languages,
        languageKeys,
        languageTranslations
      },
      recent: {
        users: recentUsers.map((item) => ({
          id: item.id,
          email: item.email,
          role: item.role,
          createdAt: item.createdAt.toISOString()
        })),
        campaigns: recentCampaigns.map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          updatedAt: item.updatedAt.toISOString()
        })),
        orders: recentOrders.map((item) => ({
          id: item.id,
          serviceProject: item.serviceProject,
          status: item.status,
          amount: Number(item.orderAmount),
          createdAt: item.createdAt.toISOString()
        })),
        conversations: recentConversations.map((item) => ({
          id: item.id,
          channel: item.channel,
          status: item.status,
          updatedAt: item.updatedAt.toISOString()
        }))
      }
    };
  }
}

export const adminDatabaseService = new AdminDatabaseService();
