import { adminRepository } from "@/features/admin/admin.repository";
import type { AdminAuditLogView } from "@/features/admin/admin.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AuditService {
  async list(
    user: AuthUser,
    filters?: {
      campaignId?: string;
      userId?: string;
      action?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AdminAuditLogView[]> {
    PermissionService.assert(user, "admin.audit.read");
    if (!hasDatabaseUrl()) return [];

    const rows = await adminRepository.listAuditLogs(filters);
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
}

export const auditService = new AuditService();
