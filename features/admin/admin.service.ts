import { adminRepository } from "@/features/admin/admin.repository";
import type { AdminOverviewStats } from "@/features/admin/admin.types";
import { auditService } from "@/features/admin/audit.service";
import { disputeService } from "@/features/admin/dispute.service";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export class AdminService {
  async getOverview(user: AuthUser): Promise<AdminOverviewStats> {
    PermissionService.assert(user, "admin.overview.read");

    if (!hasDatabaseUrl()) {
      return {
        campaignCount: 0,
        activeCampaignCount: 0,
        openDisputeCount: 0,
        escrowHeldTotal: 0,
        userCount: 0,
        creatorCount: 0,
        brandCount: 0
      };
    }

    const [campaigns, users, openDisputes, escrowHeld] = await Promise.all([
      adminRepository.countCampaigns(),
      adminRepository.countUsers(),
      adminRepository.countOpenDisputes(),
      adminRepository.sumEscrowHeld()
    ]);

    return {
      campaignCount: campaigns.total,
      activeCampaignCount: campaigns.active,
      openDisputeCount: openDisputes,
      escrowHeldTotal: escrowHeld,
      userCount: users.total,
      creatorCount: users.creators,
      brandCount: users.brands
    };
  }

  async getOpsPreview(user: AuthUser) {
    PermissionService.assert(user, "admin.overview.read");
    if (!hasDatabaseUrl()) {
      return { openDisputes: [], recentAudit: [], recentCampaigns: [] };
    }

    const [allDisputes, recentAudit, recentCampaigns] = await Promise.all([
      disputeService.list(user),
      auditService.list(user, { limit: 8 }),
      adminRepository.listRecentCampaigns(8)
    ]);

    return {
      openDisputes: allDisputes.filter((d) => d.status === "OPEN" || d.status === "PROCESSING").slice(0, 5),
      recentAudit,
      recentCampaigns: recentCampaigns.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        brandName: row.brand.brandProfile?.companyName ?? row.brand.fullName ?? null,
        creatorName: row.creator?.creatorProfile?.displayName ?? row.creator?.fullName ?? null,
        updatedAt: row.updatedAt.toISOString()
      }))
    };
  }
}

export const adminService = new AdminService();
