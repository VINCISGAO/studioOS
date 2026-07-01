import { adminCampaignRepository } from "@/features/admin/campaign/admin-campaign.repository";
import type {
  AdminCampaignDetail,
  AdminCampaignListFilters,
  AdminCampaignListItem
} from "@/features/admin/campaign/admin-campaign.types";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { readProductionBrief } from "@/features/campaign/brand-campaign/brand-campaign.utils";
import { settlementService } from "@/features/settlement/settlement.service";
import { settlementRepository } from "@/features/settlement/settlement.repository";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { prisma } from "@/lib/core/database/prisma";

function resolveLegacyProjectId(productionBrief: unknown, campaignId: string): string | null {
  const brief = readProductionBrief(productionBrief);
  const legacy = brief.legacy_project_id;
  return typeof legacy === "string" ? legacy : campaignId;
}

function deriveSettlementDisplay(
  ctx: Awaited<ReturnType<typeof settlementRepository.findContextByCampaignId>>,
  openDisputes: number
): AdminCampaignListItem["settlementState"] {
  if (openDisputes > 0) return "DISPUTE";
  if (!ctx) return "BLOCKED";
  return settlementService.resolveState(ctx);
}

export class AdminCampaignService {
  async list(user: AuthUser, filters: AdminCampaignListFilters) {
    PermissionService.assert(user, "admin.campaign.manage");
    if (!hasDatabaseUrl()) return { items: [], total: 0 };

    const { rows, total } = await adminCampaignRepository.list(filters);

    const items: AdminCampaignListItem[] = [];
    for (const row of rows) {
      const ctx = await settlementRepository.findContextByCampaignId(row.id);
      const settlementState = deriveSettlementDisplay(ctx, row.disputes.length);

      if (filters.settlementState && settlementState !== filters.settlementState) {
        continue;
      }

      items.push({
        id: row.id,
        title: row.title,
        status: row.status,
        budget: Number(row.budget),
        currency: row.currency,
        reviewRound: row.reviewRound,
        legacyProjectId: resolveLegacyProjectId(row.productionBrief, row.id),
        brandId: row.brandId,
        brandName: row.brand.brandProfile?.companyName ?? row.brand.fullName ?? null,
        brandEmail: row.brand.email,
        creatorId: row.creatorId,
        creatorName: row.creator?.creatorProfile?.displayName ?? row.creator?.fullName ?? null,
        escrowStatus: row.escrow?.status ?? null,
        deliveryStatus: row.deliveries[0]?.status ?? null,
        settlementState,
        updatedAt: row.updatedAt.toISOString()
      });
    }

    return {
      items,
      total: filters.settlementState ? items.length : total
    };
  }

  async getDetail(user: AuthUser, id: string): Promise<AdminCampaignDetail> {
    PermissionService.assert(user, "admin.campaign.manage");
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "Database required");

    const row = await adminCampaignRepository.findById(id);
    if (!row) throw appError("NOT_FOUND", "Campaign not found");

    const ctx = await settlementRepository.findContextByCampaignId(id);
    const legacyProjectId = resolveLegacyProjectId(row.productionBrief, row.id);
    const settlementState = deriveSettlementDisplay(ctx, row.disputes.length);

    let settlementPreview: AdminCampaignDetail["settlementPreview"] = null;
    if (legacyProjectId) {
      const preview = await settlementService.previewForLegacyProject(legacyProjectId);
      if (preview) {
        settlementPreview = {
          orderAmount: preview.orderAmount,
          creatorPayoutAmount: preview.creatorPayoutAmount,
          creatorCommissionAmount: preview.creatorCommissionAmount,
          platformTotalRevenue: preview.platformTotalRevenue,
          currency: preview.currency
        };
      }
    }

    let wallet: AdminCampaignDetail["wallet"] = null;
    if (row.creatorId) {
      const w = await prisma.wallet.findUnique({ where: { userId: row.creatorId } });
      if (w) {
        wallet = {
          availableBalance: Number(w.availableBalance),
          pendingBalance: Number(w.pendingBalance),
          totalEarned: Number(w.totalEarned),
          totalWithdraw: Number(w.totalWithdraw)
        };
      }
    }

    const delivery = row.deliveries[0] ?? null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      budget: Number(row.budget),
      currency: row.currency,
      deadline: row.deadline.toISOString(),
      reviewRound: row.reviewRound,
      currentVersion: row.currentVersion,
      legacyProjectId,
      brand: {
        id: row.brand.id,
        email: row.brand.email,
        name: row.brand.brandProfile?.companyName ?? row.brand.fullName ?? null
      },
      creator: row.creator
        ? {
            id: row.creator.id,
            email: row.creator.email,
            name: row.creator.creatorProfile?.displayName ?? row.creator.fullName ?? null
          }
        : null,
      escrow: row.escrow
        ? {
            id: row.escrow.id,
            status: row.escrow.status,
            amount: Number(row.escrow.amount),
            releasedAmount: Number(row.escrow.releasedAmount),
            remainingAmount: Number(row.escrow.remainingAmount),
            paymentStatus: row.escrow.paymentStatus,
            creatorPayoutStatus: row.escrow.creatorPayoutStatus,
            paidAt: row.escrow.paidAt?.toISOString() ?? null,
            payoutPaidAt: row.escrow.payoutPaidAt?.toISOString() ?? null
          }
        : null,
      delivery: delivery
        ? {
            id: delivery.id,
            status: delivery.status,
            deliveredAt: delivery.deliveredAt.toISOString(),
            acceptedAt: delivery.acceptedAt?.toISOString() ?? null,
            downloadUrl: delivery.downloadUrl
          }
        : null,
      settlementPreview,
      settlementState,
      wallet,
      versions: row.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        status: v.status,
        reviewStatus: v.reviewStatus,
        reviewRound: v.reviewRound,
        fileName: v.fileName,
        createdAt: v.createdAt.toISOString()
      })),
      comments: row.comments.map((c) => ({
        id: c.id,
        versionNumber: c.version.versionNumber,
        userEmail: c.user.email,
        comment: c.comment,
        timeSeconds: Number(c.timeSeconds),
        resolved: c.resolved,
        createdAt: c.createdAt.toISOString()
      })),
      ledgerEntries: row.ledgerEntries.map((e) => ({
        id: e.id,
        entryType: e.entryType,
        direction: e.direction,
        amount: Number(e.amount),
        assetCode: e.assetCode,
        description: e.description,
        createdAt: e.createdAt.toISOString()
      })),
      activityLogs: row.activities.map((a) => ({
        id: a.id,
        action: a.action,
        userEmail: a.user?.email ?? null,
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString()
      })),
      notifications: row.notifications.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        isSent: n.isSent,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString()
      })),
      openDisputes: row.disputes.length,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }
}

export const adminCampaignService = new AdminCampaignService();
