import { activityLogWriter } from "@/features/admin/activity-log.service";
import { adminSettlementRepository } from "@/features/admin/settlement/admin-settlement.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { disputeService } from "@/features/admin/dispute.service";
import { settlementRepository } from "@/features/settlement/settlement.repository";
import { settlementService } from "@/features/settlement/settlement.service";
import { SettlementState } from "@/features/settlement/settlement.state-machine";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { Locale } from "@/lib/i18n";

export type AdminSettlementQueueState =
  | "READY"
  | "LOCKED"
  | "RELEASED"
  | "FAILED"
  | "DISPUTE";

export type AdminSettlementQueueItem = {
  campaignId: string;
  title: string;
  brandName: string | null;
  creatorName: string | null;
  queueState: AdminSettlementQueueState;
  escrowStatus: string | null;
  escrowRemaining: number;
  deliveryStatus: string | null;
  ledgerPreview: Array<{ entryType: string; amount: number; createdAt: string }>;
  updatedAt: string;
};

function deriveQueueState(
  settlementState: string,
  deliveryStatus: string | null,
  hasDispute: boolean
): AdminSettlementQueueState {
  if (hasDispute) return "DISPUTE";
  if (settlementState === SettlementState.READY) return "READY";
  if (settlementState === SettlementState.RELEASED || settlementState === SettlementState.COMPLETED) {
    return "RELEASED";
  }
  if (deliveryStatus === "LOCKED") return "LOCKED";
  return "FAILED";
}

export class AdminSettlementService {
  async listQueue(user: AuthUser, filters?: { state?: string }): Promise<AdminSettlementQueueItem[]> {
    PermissionService.assert(user, "admin.settlement.manage");
    if (!hasDatabaseUrl()) return [];

    const rows = await adminSettlementRepository.listCampaigns({ state: filters?.state });

    const items: AdminSettlementQueueItem[] = [];
    for (const row of rows) {
      const ctx = await settlementRepository.findContextByCampaignId(row.id);
      const settlementState = ctx ? settlementService.resolveState(ctx) : SettlementState.BLOCKED;
      const deliveryStatus = row.deliveries?.status ?? null;
      const queueState = deriveQueueState(settlementState, deliveryStatus, row.disputes.length > 0);

      if (filters?.state && queueState !== filters.state) continue;

      items.push({
        campaignId: row.id,
        title: row.title,
        brandName: row.brand.brandProfile?.companyName ?? row.brand.fullName ?? null,
        creatorName: row.creator?.creatorProfile?.displayName ?? row.creator?.fullName ?? null,
        queueState,
        escrowStatus: row.escrow?.status ?? null,
        escrowRemaining: row.escrow ? Number(row.escrow.remainingAmount) : 0,
        deliveryStatus,
        ledgerPreview: row.ledgerEntries.map((e) => ({
          entryType: e.entryType,
          amount: Number(e.amount),
          createdAt: e.createdAt.toISOString()
        })),
        updatedAt: row.updatedAt.toISOString()
      });
    }

    return items;
  }

  async releaseSettlement(user: AuthUser, campaignId: string, locale: Locale = "en") {
    PermissionService.assert(user, "admin.settlement.manage");
    const result = await settlementService.releaseForCampaign({
      campaignId,
      actor: { id: user.id, role: user.role, email: user.id },
      locale
    });
    if (!result.ok) throw appError("CONFLICT", result.error);
    return result.result;
  }

  async retryRelease(user: AuthUser, campaignId: string, locale: Locale = "en") {
    return this.releaseSettlement(user, campaignId, locale);
  }

  async freezeSettlement(user: AuthUser, campaignId: string, reason: string) {
    PermissionService.assert(user, "admin.settlement.manage");
    await disputeService.open(user, campaignId, reason || "Admin freeze for settlement review");
    await activityLogWriter.write({
      campaignId,
      userId: user.id,
      action: "admin.settlement.freeze",
      metadata: { reason }
    });
    return { ok: true };
  }

  async cancelSettlement(user: AuthUser, campaignId: string, note: string) {
    PermissionService.assert(user, "admin.settlement.manage");
    await activityLogWriter.write({
      campaignId,
      userId: user.id,
      action: "admin.settlement.cancel",
      metadata: { note }
    });
    return { ok: true };
  }
}

export const adminSettlementService = new AdminSettlementService();
