import type { CampaignStatus, DeliveryStatus, EscrowStatus, Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { AdminCampaignListFilters } from "@/features/admin/campaign/admin-campaign.types";

const campaignListInclude = {
  brand: {
    select: {
      id: true,
      email: true,
      fullName: true,
      brandProfile: { select: { companyName: true } }
    }
  },
  creator: {
    select: {
      id: true,
      email: true,
      fullName: true,
      creatorProfile: { select: { displayName: true } }
    }
  },
  escrow: true,
  deliveries: true,
  orderCommission: true,
  disputes: { where: { status: { in: ["OPEN", "PROCESSING"] as const } } }
} satisfies Prisma.CampaignInclude;

function buildWhere(filters: AdminCampaignListFilters): Prisma.CampaignWhereInput {
  const where: Prisma.CampaignWhereInput = { deletedAt: null };

  if (filters.status) {
    where.status = filters.status as CampaignStatus;
  }
  if (filters.reviewRound !== undefined && !Number.isNaN(filters.reviewRound)) {
    where.reviewRound = filters.reviewRound;
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { id: { contains: q, mode: "insensitive" } }
    ];
  }
  if (filters.brandSearch?.trim()) {
    const q = filters.brandSearch.trim();
    where.brand = {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { brandProfile: { companyName: { contains: q, mode: "insensitive" } } }
      ]
    };
  }
  if (filters.creatorSearch?.trim()) {
    const q = filters.creatorSearch.trim();
    where.creator = {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { creatorProfile: { displayName: { contains: q, mode: "insensitive" } } }
      ]
    };
  }
  if (filters.escrowStatus) {
    where.escrow = { status: filters.escrowStatus as EscrowStatus };
  }
  if (filters.deliveryStatus) {
    where.deliveries = { some: { status: filters.deliveryStatus as DeliveryStatus } };
  }

  return where;
}

export class AdminCampaignRepository {
  async list(filters: AdminCampaignListFilters) {
    if (!hasDatabaseUrl()) return { rows: [], total: 0 };

    const where = buildWhere(filters);
    const [rows, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: filters.limit ?? 50,
        skip: filters.offset ?? 0,
        include: campaignListInclude
      }),
      prisma.campaign.count({ where })
    ]);

    return { rows, total };
  }

  async findById(id: string) {
    if (!hasDatabaseUrl()) return null;

    return prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        brand: {
          select: {
            id: true,
            email: true,
            fullName: true,
            brandProfile: { select: { companyName: true } }
          }
        },
        creator: {
          select: {
            id: true,
            email: true,
            fullName: true,
            creatorProfile: { select: { displayName: true } }
          }
        },
        escrow: true,
        deliveries: true,
        orderCommission: true,
        versions: {
          where: { deletedAt: null },
          orderBy: { versionNumber: "desc" }
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            user: { select: { email: true } },
            version: { select: { versionNumber: true } }
          }
        },
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 50
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { email: true } } }
        },
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 30
        },
        disputes: { where: { status: { in: ["OPEN", "PROCESSING"] } } }
      }
    });
  }
}

export const adminCampaignRepository = new AdminCampaignRepository();
