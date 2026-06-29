import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";

export class ActivityService {
  async listForCampaign(campaignId: string, user: AuthUser, limit = 50) {
    if (!hasDatabaseUrl()) return [];

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign) && user.role.toUpperCase() !== "ADMIN") {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    PermissionService.assert(user, "campaign.read");

    const logs = await prisma.activityLog.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { id: true, email: true, fullName: true, role: true } } }
    });

    return logs.map((log) => ({
      id: log.id,
      campaignId: log.campaignId,
      userId: log.userId,
      action: log.action,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
      user: log.user
        ? { id: log.user.id, email: log.user.email, fullName: log.user.fullName, role: log.user.role }
        : null
    }));
  }
}

export const activityService = new ActivityService();
