import type { Prisma } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export type AdminNotificationFilters = {
  failed?: boolean;
  userId?: string;
  campaignId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export class AdminNotificationRepository {
  async list(filters: AdminNotificationFilters) {
    if (!hasDatabaseUrl()) return [];

    const where: Prisma.NotificationWhereInput = {};
    if (filters.failed) where.isSent = false;
    if (filters.userId) where.userId = filters.userId;
    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit ?? 100,
      include: {
        user: { select: { email: true, fullName: true } },
        campaign: { select: { title: true } }
      }
    });
  }

  async findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }
}

export const adminNotificationRepository = new AdminNotificationRepository();
