import type { DisputeStatus } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AdminRepository {
  async countUsers() {
    if (!hasDatabaseUrl()) return { total: 0, brands: 0, creators: 0 };
    const [total, brands, creators] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "BRAND" } }),
      prisma.user.count({ where: { role: "CREATOR" } })
    ]);
    return { total, brands, creators };
  }

  async countCampaigns() {
    if (!hasDatabaseUrl()) return { total: 0, active: 0 };
    const total = await prisma.campaign.count();
    const active = await prisma.campaign.count({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } }
    });
    return { total, active };
  }

  async sumEscrowHeld() {
    if (!hasDatabaseUrl()) return 0;
    const rows = await prisma.escrowPayment.findMany({
      where: { status: "HELD" },
      select: { remainingAmount: true }
    });
    return rows.reduce((sum, row) => sum + Number(row.remainingAmount), 0);
  }

  async listDisputes(filters?: { status?: DisputeStatus; limit?: number }) {
    if (!hasDatabaseUrl()) return [];
    return prisma.dispute.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: filters?.limit ?? 100,
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            brand: { select: { fullName: true, brandProfile: { select: { companyName: true } } } }
          }
        }
      }
    });
  }

  async countOpenDisputes() {
    if (!hasDatabaseUrl()) return 0;
    return prisma.dispute.count({ where: { status: { in: ["OPEN", "PROCESSING"] } } });
  }

  async findDisputeById(id: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.dispute.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            brandId: true,
            brand: { select: { fullName: true, brandProfile: { select: { companyName: true } } } }
          }
        }
      }
    });
  }

  async updateDispute(
    id: string,
    data: { status?: DisputeStatus; adminId?: string; result?: string }
  ) {
    return prisma.dispute.update({ where: { id }, data });
  }

  async createDispute(input: { campaignId: string; openedBy: string; reason: string }) {
    return prisma.dispute.create({
      data: {
        campaignId: input.campaignId,
        openedBy: input.openedBy,
        reason: input.reason,
        status: "OPEN"
      }
    });
  }

  async findOpenDisputeForCampaign(campaignId: string) {
    return prisma.dispute.findFirst({
      where: { campaignId, status: { in: ["OPEN", "PROCESSING"] } }
    });
  }

  async listRecentCampaigns(limit = 10) {
    if (!hasDatabaseUrl()) return [];
    return prisma.campaign.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        currency: true,
        updatedAt: true,
        brand: { select: { fullName: true, brandProfile: { select: { companyName: true } } } },
        creator: { select: { fullName: true, creatorProfile: { select: { displayName: true } } } }
      }
    });
  }

  async listAuditLogs(filters?: {
    campaignId?: string;
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) {
    if (!hasDatabaseUrl()) return [];
    return prisma.activityLog.findMany({
      where: {
        ...(filters?.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters?.userId ? { userId: filters.userId } : {}),
        ...(filters?.action ? { action: { contains: filters.action, mode: "insensitive" } } : {})
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit ?? 100,
      skip: filters?.offset ?? 0,
      include: {
        campaign: { select: { id: true, title: true } },
        user: { select: { id: true, email: true, fullName: true } }
      }
    });
  }

  async listFeatureFlags() {
    if (!hasDatabaseUrl()) return [];
    return prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  }

  async findFeatureFlagByKey(key: string) {
    if (!hasDatabaseUrl()) return null;
    return prisma.featureFlag.findUnique({ where: { key } });
  }

  async upsertFeatureFlag(input: { key: string; enabled: boolean; metadata?: unknown }) {
    return prisma.featureFlag.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        enabled: input.enabled,
        metadata: input.metadata ?? undefined
      },
      update: {
        enabled: input.enabled,
        ...(input.metadata !== undefined ? { metadata: input.metadata as object } : {})
      }
    });
  }
}

export const adminRepository = new AdminRepository();
