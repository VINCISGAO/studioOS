import { activityLogWriter } from "@/features/admin/activity-log.service";
import { adminWalletRepository } from "@/features/admin/wallet/admin-wallet.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { ledgerService } from "@/features/finance/ledger.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import type { WalletAssetCode } from "@prisma/client";

async function resolveActivityCampaignId(userId: string): Promise<string | null> {
  const campaign = await prisma.campaign.findFirst({
    where: { OR: [{ brandId: userId }, { creatorId: userId }], deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true }
  });
  return campaign?.id ?? null;
}

async function writeAdminWalletActivity(
  user: AuthUser,
  targetUserId: string,
  action: string,
  metadata: Record<string, unknown>
) {
  const campaignId = await resolveActivityCampaignId(targetUserId);
  if (!campaignId) return;
  await activityLogWriter.write({
    campaignId,
    userId: user.id,
    action,
    metadata: { targetUserId, ...metadata }
  });
}

export type AdminWalletListItem = {
  userId: string;
  email: string | null;
  name: string | null;
  role: string;
  legacyAvailable: number;
  legacyPending: number;
  assets: Array<{ assetCode: string; available: number; pending: number; frozen: number }>;
};

export class AdminWalletService {
  async list(user: AuthUser, search?: string): Promise<{ items: AdminWalletListItem[]; total: number }> {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!hasDatabaseUrl()) return { items: [], total: 0 };

    const { rows, total } = await adminWalletRepository.listWallets(100, 0, search);
    return {
      items: rows.map((row) => ({
        userId: row.id,
        email: row.email,
        name: row.fullName,
        role: row.role,
        legacyAvailable: row.wallet ? Number(row.wallet.availableBalance) : 0,
        legacyPending: row.wallet ? Number(row.wallet.pendingBalance) : 0,
        assets: (row.walletAccount?.assets ?? []).map((a) => ({
          assetCode: a.assetCode,
          available: Number(a.availableBalance),
          pending: Number(a.pendingBalance),
          frozen: Number(a.frozenBalance)
        }))
      })),
      total
    };
  }

  async getDetail(user: AuthUser, userId: string) {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "Database required");

    const row = await adminWalletRepository.findUserWallet(userId);
    if (!row) throw appError("NOT_FOUND", "User not found");

    return {
      userId: row.id,
      email: row.email,
      name: row.fullName,
      role: row.role,
      wallet: row.wallet
        ? {
            availableBalance: Number(row.wallet.availableBalance),
            pendingBalance: Number(row.wallet.pendingBalance),
            totalEarned: Number(row.wallet.totalEarned),
            totalWithdraw: Number(row.wallet.totalWithdraw),
            transactions: row.wallet.transactions.map((t) => ({
              id: t.id,
              type: t.type,
              amount: Number(t.amount),
              description: t.description,
              createdAt: t.createdAt.toISOString()
            }))
          }
        : null,
      walletAccount: row.walletAccount
        ? {
            assets: row.walletAccount.assets.map((a) => ({
              assetCode: a.assetCode,
              available: Number(a.availableBalance),
              pending: Number(a.pendingBalance),
              frozen: Number(a.frozenBalance)
            })),
            entries: row.walletAccount.entries.map((e) => ({
              id: e.id,
              entryType: e.entryType,
              direction: e.direction,
              amount: Number(e.amount),
              assetCode: e.assetCode,
              description: e.description,
              createdAt: e.createdAt.toISOString()
            }))
          }
        : null
    };
  }

  async manualAdjust(
    user: AuthUser,
    input: {
      userId: string;
      assetCode: WalletAssetCode;
      amount: number;
      direction: "CREDIT" | "DEBIT";
      description: string;
    }
  ) {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!ledgerService.isEnabled()) throw appError("SYSTEM_ERROR", "Ledger not enabled");

    const availableDelta = input.direction === "CREDIT" ? input.amount : -input.amount;
    const result = await ledgerService.recordManualAdjustment({
      userId: input.userId,
      assetCode: input.assetCode,
      amount: input.amount,
      direction: input.direction,
      availableDelta,
      description: input.description,
      metadata: { adminId: user.id }
    });

    await writeAdminWalletActivity(user, input.userId, "admin.wallet.manual_adjustment", {
      assetCode: input.assetCode,
      amount: input.amount,
      direction: input.direction,
      description: input.description
    });

    return result;
  }
}

export const adminWalletService = new AdminWalletService();
