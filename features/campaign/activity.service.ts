import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { activityLogWriter } from "@/features/admin/activity-log.service";
import { readRequestMeta } from "@/lib/core/request-meta";

export type ActivityActor = {
  userId?: string | null;
  email: string;
  role?: "brand" | "creator" | "system" | "admin";
};

export class ActivityService {
  private async requestMeta() {
    return readRequestMeta();
  }

  async write(
    campaignId: string,
    action: string,
    actor: ActivityActor,
    metadata?: Record<string, unknown>
  ) {
    if (!hasDatabaseUrl()) return null;
    const meta = await this.requestMeta();
    return activityLogWriter.write({
      campaignId,
      userId: actor.userId ?? null,
      action,
      metadata: {
        actor_email: actor.email,
        ...metadata
      },
      ip: meta.ip,
      device: meta.device
    });
  }

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
