import type { AdminAuditLogView } from "@/features/admin/admin.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { Prisma } from "@prisma/client";

export type AdminActivityLogFilters = {
  campaignId?: string;
  userId?: string;
  action?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export class AdminActivityLogService {
  async list(user: AuthUser, filters?: AdminActivityLogFilters): Promise<AdminAuditLogView[]> {
    PermissionService.assert(user, "admin.audit.read");
    if (!hasDatabaseUrl()) return [];

    const where: Prisma.ActivityLogWhereInput = {};
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = { contains: filters.action, mode: "insensitive" };
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { action: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } }
      ];
    }

    const rows = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters?.limit ?? 100,
      skip: filters?.offset ?? 0,
      include: {
        campaign: { select: { id: true, title: true } },
        user: { select: { id: true, email: true, fullName: true } }
      }
    });

    return rows.map((log) => ({
      id: log.id,
      campaignId: log.campaignId,
      campaignTitle: log.campaign?.title ?? null,
      userId: log.userId,
      userEmail: log.user?.email ?? null,
      action: log.action,
      ip: log.ip,
      device: log.device,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString()
    }));
  }

  /** Back-compat wrapper for audit page */
  async listSimple(
    user: AuthUser,
    filters?: { campaignId?: string; userId?: string; action?: string; limit?: number; offset?: number }
  ) {
    return this.list(user, filters);
  }
}

export const adminActivityLogService = new AdminActivityLogService();
