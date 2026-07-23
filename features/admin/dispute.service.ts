import { adminRepository } from "@/features/admin/admin.repository";
import type { AdminDisputeView } from "@/features/admin/admin.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { notificationService } from "@/features/notification/notification.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { getAppBaseUrl } from "@/lib/app-url";
import type { DisputeStatus } from "@prisma/client";
import { activityLogWriter } from "@/features/admin/activity-log.service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { resolveLegacyProjectId } from "@/features/matching/invitation.mapper";

function mapDispute(
  row: NonNullable<Awaited<ReturnType<typeof adminRepository.findDisputeById>>>
): AdminDisputeView {
  const brandName =
    row.campaign.brand.brandProfile?.companyName ?? row.campaign.brand.fullName ?? null;
  return {
    id: row.id,
    campaignId: row.campaignId,
    campaignTitle: row.campaign.title,
    brandName,
    openedBy: row.openedBy,
    reason: row.reason,
    status: row.status,
    adminId: row.adminId,
    result: row.result,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export class DisputeService {
  async list(user: AuthUser, status?: DisputeStatus): Promise<AdminDisputeView[]> {
    PermissionService.assert(user, "admin.dispute.manage");
    if (!hasDatabaseUrl()) return [];

    const rows = await adminRepository.listDisputes({ status, limit: 200 });
    return rows.map((row) => ({
      id: row.id,
      campaignId: row.campaignId,
      campaignTitle: row.campaign.title,
      brandName: row.campaign.brand.brandProfile?.companyName ?? row.campaign.brand.fullName ?? null,
      openedBy: row.openedBy,
      reason: row.reason,
      status: row.status,
      adminId: row.adminId,
      result: row.result,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }));
  }

  async get(user: AuthUser, id: string): Promise<AdminDisputeView> {
    PermissionService.assert(user, "admin.dispute.manage");
    const row = await adminRepository.findDisputeById(id);
    if (!row) throw appError("NOT_FOUND", "Dispute not found");
    return mapDispute(row);
  }

  async resolve(
    user: AuthUser,
    id: string,
    input: { status: DisputeStatus; result: string }
  ): Promise<AdminDisputeView> {
    PermissionService.assert(user, "admin.dispute.manage");

    const existing = await adminRepository.findDisputeById(id);
    if (!existing) throw appError("NOT_FOUND", "Dispute not found");
    if (existing.status === "CLOSED") {
      throw appError("CONFLICT", "Dispute is already closed");
    }

    await adminRepository.updateDispute(id, {
      status: input.status,
      adminId: user.id,
      result: input.result
    });

    await activityLogWriter.write({
      campaignId: existing.campaignId,
      userId: user.id,
      action: "dispute.resolved",
      metadata: { disputeId: id, status: input.status, result: input.result }
    });

    const updated = await adminRepository.findDisputeById(id);
    if (!updated) throw appError("NOT_FOUND", "Dispute not found");
    const legacyProjectId = resolveLegacyProjectId(updated.campaign);
    const recipientIds = [updated.campaign.brandId, updated.campaign.creatorId].filter(
      (value): value is string => Boolean(value)
    );
    await Promise.all(
      recipientIds.map((userId) =>
        notificationService.notify({
          userId,
          campaignId: updated.campaignId,
          type: "arbitration.resolved",
          category: "ARBITRATION",
          title: "Arbitration updated",
          content: `Platform arbitration for "${updated.campaign.title}" is now ${input.status}.`,
          actionUrl:
            userId === updated.campaign.brandId
              ? `${getAppBaseUrl()}/brand/projects/${legacyProjectId}`
              : `${getAppBaseUrl()}/studio/projects`,
          template: "arbitration.resolved",
          priority: input.status === "CLOSED" ? "HIGH" : "NORMAL",
          email: false,
          metadata: { disputeId: id, status: input.status, project: updated.campaign.title }
        }).catch(() => undefined)
      )
    );
    return mapDispute(updated);
  }

  /** Brand or creator opens a dispute on a campaign they participate in. */
  async open(user: AuthUser, campaignId: string, reason: string): Promise<AdminDisputeView> {
    PermissionService.assert(user, "campaign.read");
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "Database required");

    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign)) {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    const existing = await adminRepository.findOpenDisputeForCampaign(campaignId);
    if (existing) {
      throw appError("CONFLICT", "An open dispute already exists for this campaign");
    }

    const dispute = await adminRepository.createDispute({
      campaignId,
      openedBy: user.id,
      reason
    });

    await activityLogWriter.write({
      campaignId,
      userId: user.id,
      action: "dispute.opened",
      metadata: { disputeId: dispute.id, reason }
    });

    const row = await adminRepository.findDisputeById(dispute.id);
    if (!row) throw appError("NOT_FOUND", "Dispute not found");
    const legacyProjectId = resolveLegacyProjectId(row.campaign);
    const adminUsers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPPORT"] }, deletedAt: null },
      select: { id: true }
    });
    const participantIds = [row.campaign.brandId, row.campaign.creatorId].filter(
      (value): value is string => Boolean(value && value !== user.id)
    );
    const adminUrl = `${getAppBaseUrl()}/admin/disputes/${row.id}`;

    await Promise.all([
      ...adminUsers.map((admin) =>
        notificationService.notify({
          userId: admin.id,
          campaignId,
          type: "arbitration.opened",
          category: "ARBITRATION",
          title: "New arbitration case opened",
          content: `${row.campaign.title}: ${reason}`,
          actionUrl: adminUrl,
          template: "arbitration.started",
          priority: "URGENT",
          metadata: {
            disputeId: row.id,
            openedBy: user.id,
            project: row.campaign.title,
            status: "Open",
            expectedResolution: "Platform review in progress"
          }
        }).catch(() => undefined)
      ),
      ...participantIds.map((participantId) =>
        notificationService.notify({
          userId: participantId,
          campaignId,
          type: "arbitration.opened",
          category: "ARBITRATION",
          title: "Arbitration started",
          content: `A platform arbitration case has started for "${row.campaign.title}".`,
          actionUrl:
            participantId === row.campaign.brandId
              ? `${getAppBaseUrl()}/brand/projects/${legacyProjectId}`
              : `${getAppBaseUrl()}/studio/projects`,
          template: "arbitration.started",
          priority: "URGENT",
          metadata: {
            disputeId: row.id,
            openedBy: user.id,
            project: row.campaign.title,
            status: "Open",
            expectedResolution: "Platform review in progress"
          }
        }).catch(() => undefined)
      )
    ]);
    return mapDispute(row);
  }

  async listForCampaign(user: AuthUser, campaignId: string): Promise<AdminDisputeView[]> {
    PermissionService.assert(user, "campaign.read");
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw appError("NOT_FOUND", "Campaign not found");
    if (!PermissionService.canAccessCampaign(user, campaign) && user.role.toUpperCase() !== "ADMIN") {
      throw appError("FORBIDDEN", "Not allowed for this campaign");
    }

    const rows = await adminRepository.listDisputes({ limit: 50 });
    return rows
      .filter((row) => row.campaignId === campaignId)
      .map((row) => ({
        id: row.id,
        campaignId: row.campaignId,
        campaignTitle: row.campaign.title,
        brandName: row.campaign.brand.brandProfile?.companyName ?? row.campaign.brand.fullName ?? null,
        openedBy: row.openedBy,
        reason: row.reason,
        status: row.status,
        adminId: row.adminId,
        result: row.result,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString()
      }));
  }
}

export const disputeService = new DisputeService();
