import type { AuthUser } from "@/features/auth/permission.service";
import { stripeConnectService } from "@/features/payment/stripe-connect.service";
import { withdrawService } from "@/features/wallet/withdraw.service";
import { walletRepository } from "@/features/wallet/wallet.repository";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { logger } from "@/lib/core/logger";
import { isStripeConnectConfigured } from "@/lib/payment/stripe-connect-ready";
import { isPaymentStubMode } from "@/lib/payment/payment-stub";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export class StripeConnectWithdrawalService {
  private assertDb() {
    if (!hasDatabaseUrl()) {
      throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
    }
  }

  async submitWithdrawal(user: AuthUser, amountUsd: number) {
    this.assertDb();

    if (!isStripeConnectConfigured()) {
      if (isPaymentStubMode()) {
        throw appError(
          "SYSTEM_ERROR",
          "Stripe Connect is not configured. Set STRIPE_SECRET_KEY for sandbox payouts."
        );
      }
      throw appError("SYSTEM_ERROR", "Stripe Connect payouts are not configured");
    }

    const status = await stripeConnectService.getStatus(user.id);
    if (!status.payoutsEnabled || !status.accountId) {
      throw appError("VALIDATION_ERROR", "Complete Stripe Connect onboarding before withdrawing");
    }

    const withdraw = await withdrawService.requestWithdraw(user, amountUsd);

    try {
      const transfer = await stripeConnectService.createTransfer({
        userId: user.id,
        withdrawId: withdraw.withdrawId,
        amountUsd: withdraw.amount,
        idempotencyKey: withdraw.withdrawId
      });

      const completed = await withdrawService.completeWithdraw(withdraw.withdrawId, user);

      await prisma.transaction.update({
        where: { id: withdraw.withdrawId },
        data: {
          description: `Stripe Connect transfer ${transfer.transferId} ref:${withdraw.withdrawId}`
        }
      });

      logger.info("stripe.connect.withdrawal_completed", {
        service: "StripeConnectWithdrawalService",
        userId: user.id,
        withdrawId: withdraw.withdrawId,
        transferId: transfer.transferId,
        amountUsd: withdraw.amount
      });

      return {
        withdrawId: withdraw.withdrawId,
        transferId: transfer.transferId,
        amountUsd: withdraw.amount,
        wallet: completed.wallet,
        alreadyCompleted: completed.alreadyCompleted
      };
    } catch (error) {
      await withdrawService.failWithdraw(
        withdraw.withdrawId,
        error instanceof Error ? error.message : "Stripe transfer failed"
      );
      throw error;
    }
  }

  async executeTransferForAdminWithdraw(withdrawId: string, admin: AuthUser) {
    this.assertDb();
    if (!isStripeConnectConfigured()) {
      return withdrawService.completeWithdraw(withdrawId, admin);
    }

    const requestTx = await walletRepository.findTransaction(withdrawId);
    if (!requestTx || requestTx.type !== "WITHDRAW_REQUEST") {
      throw appError("NOT_FOUND", "Withdraw request not found");
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: requestTx.walletId },
      select: { userId: true }
    });
    if (!wallet) {
      throw appError("NOT_FOUND", "Wallet not found");
    }

    const status = await stripeConnectService.getStatus(wallet.userId);
    if (!status.payoutsEnabled || !status.accountId) {
      return withdrawService.completeWithdraw(withdrawId, admin);
    }

    const amountUsd = roundMoney(Number(requestTx.amount));
    const transfer = await stripeConnectService.createTransfer({
      userId: wallet.userId,
      withdrawId,
      amountUsd,
      idempotencyKey: withdrawId
    });

    const completed = await withdrawService.completeWithdraw(withdrawId, admin);
    await prisma.transaction.update({
      where: { id: withdrawId },
      data: {
        description: `Stripe Connect transfer ${transfer.transferId} ref:${withdrawId}`
      }
    });

    return { ...completed, transferId: transfer.transferId };
  }
}

export const stripeConnectWithdrawalService = new StripeConnectWithdrawalService();
