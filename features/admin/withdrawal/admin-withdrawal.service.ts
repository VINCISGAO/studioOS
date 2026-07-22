import { activityLogWriter } from "@/features/admin/activity-log.service";
import { adminWithdrawalRepository } from "@/features/admin/withdrawal/admin-withdrawal.repository";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { withdrawService } from "@/features/wallet/withdraw.service";
import { walletRepository } from "@/features/wallet/wallet.repository";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

async function writeWithdrawActivity(
  admin: AuthUser,
  targetUserId: string,
  action: string,
  metadata: Record<string, unknown>
) {
  const campaign = await prisma.campaign.findFirst({
    where: { OR: [{ brandId: targetUserId }, { creatorId: targetUserId }], deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true }
  });
  if (!campaign) return;
  await activityLogWriter.write({
    campaignId: campaign.id,
    userId: admin.id,
    action,
    metadata
  });
}

export type AdminWithdrawalItem = {
  withdrawId: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  paymentMethods: Array<{
    id: string;
    type: string;
    provider: string;
    accountName: string | null;
    accountNumber: string | null;
    accountEmail: string | null;
    walletAddress: string | null;
    network: string | null;
    currency: string;
    isDefault: boolean;
  }>;
};

export class AdminWithdrawalService {
  async listPending(user: AuthUser): Promise<AdminWithdrawalItem[]> {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!hasDatabaseUrl()) return [];

    const rows = await adminWithdrawalRepository.listPendingRequests();
    return rows.map((row) => ({
      withdrawId: row.id,
      userId: row.wallet.user.id,
      userEmail: row.wallet.user.email,
      userName: row.wallet.user.fullName,
      amount: Number(row.amount),
      balanceAfter: Number(row.balanceAfter),
      createdAt: row.createdAt.toISOString(),
      paymentMethods: row.wallet.user.paymentMethods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        provider: pm.provider,
        accountName: pm.accountName,
        accountNumber: pm.accountNumber,
        accountEmail: pm.accountEmail,
        walletAddress: pm.walletAddress,
        network: pm.network,
        currency: pm.currency,
        isDefault: pm.isDefault
      }))
    }));
  }

  async approve(user: AuthUser, withdrawId: string) {
    PermissionService.assert(user, "admin.wallet.manage");
    const requestTx = await walletRepository.findTransaction(withdrawId);
    const { stripeConnectWithdrawalService } = await import(
      "@/features/payment/stripe-connect-withdrawal.service"
    );
    const result = await stripeConnectWithdrawalService.executeTransferForAdminWithdraw(withdrawId, user);
    if (requestTx) {
      const walletRow = await prisma.wallet.findUnique({ where: { id: requestTx.walletId } });
      if (walletRow) {
        await writeWithdrawActivity(user, walletRow.userId, "admin.withdraw.approved", { withdrawId });
      }
    }
    return result;
  }

  async reject(user: AuthUser, withdrawId: string, reason: string) {
    PermissionService.assert(user, "admin.wallet.manage");

    const requestTx = await walletRepository.findTransaction(withdrawId);
    if (!requestTx || requestTx.type !== "WITHDRAW_REQUEST") {
      throw appError("NOT_FOUND", "Withdraw request not found");
    }

    const amount = Number(requestTx.amount);
    const walletRow = await prisma.wallet.findUnique({ where: { id: requestTx.walletId } });
    const result = await walletRepository.applyLedgerUpdate({
      walletId: requestTx.walletId,
      availableDelta: amount,
      entries: [
        {
          type: "WITHDRAW_FAILED",
          amount,
          description: `Withdraw rejected ref:${withdrawId} — ${reason}`
        }
      ]
    });

    if (walletRow) {
      await writeWithdrawActivity(user, walletRow.userId, "admin.withdraw.rejected", { withdrawId, reason });
    }

    return { wallet: result.wallet };
  }
}

export const adminWithdrawalService = new AdminWithdrawalService();
