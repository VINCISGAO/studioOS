import { walletRepository } from "@/features/wallet/wallet.repository";
import { serializeTransaction } from "@/features/wallet/wallet.serializer";
import { paymentConfig } from "@/lib/core/config/payment";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function allowDemoWithdrawComplete() {
  if (process.env.VINCIS_ENABLE_DEMO_WITHDRAW_COMPLETE === "1" || process.env.STUDIOOS_ENABLE_DEMO_WITHDRAW_COMPLETE === "1") {
    return true;
  }
  return process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";
}

export class WithdrawService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async requestWithdraw(user: AuthUser, amountUsd: number) {
    this.assertDb();
    PermissionService.assert(user, "wallet.withdraw");

    const amount = roundMoney(amountUsd);
    if (amount < paymentConfig.minWithdrawUsd) {
      throw appError("VALIDATION_ERROR", `Minimum withdrawal is $${paymentConfig.minWithdrawUsd}`);
    }

    const wallet = await walletRepository.getOrCreate(user.id);
    const available = Number(wallet.availableBalance);
    if (amount > available) {
      throw appError("VALIDATION_ERROR", "Amount exceeds available balance");
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRequests = await prisma.transaction.findMany({
      where: {
        walletId: wallet.id,
        type: "WITHDRAW_REQUEST",
        createdAt: { gte: todayStart }
      },
      select: { id: true }
    });
    let activeWithdrawCount = 0;
    for (const request of todayRequests) {
      const failed = await prisma.transaction.findFirst({
        where: {
          walletId: wallet.id,
          type: "WITHDRAW_FAILED",
          description: { contains: request.id }
        },
        select: { id: true }
      });
      if (!failed) {
        activeWithdrawCount += 1;
      }
    }
    if (activeWithdrawCount >= paymentConfig.maxWithdrawPerDay) {
      throw appError("VALIDATION_ERROR", "Daily withdrawal limit reached");
    }

    const balanceAfter = roundMoney(available - amount);
    const result = await walletRepository.applyLedgerUpdate({
      walletId: wallet.id,
      availableDelta: -amount,
      entries: [
        {
          type: "WITHDRAW_REQUEST",
          amount,
          balanceAfter,
          description: `Withdraw request by ${user.id}`
        }
      ]
    });

    const requestTx = result.transactions[0]!;
    return {
      withdrawId: requestTx.id,
      status: "pending" as const,
      amount,
      transaction: serializeTransaction(requestTx),
      wallet: {
        availableBalance: Number(result.wallet.availableBalance),
        pendingBalance: Number(result.wallet.pendingBalance)
      }
    };
  }

  async completeWithdraw(withdrawId: string, actor: AuthUser) {
    this.assertDb();
    if (actor.role.toUpperCase() !== "ADMIN" && actor.role.toUpperCase() !== "CREATOR") {
      throw appError("FORBIDDEN", "Not allowed to complete withdrawal");
    }

    const requestTx = await walletRepository.findTransaction(withdrawId);
    if (!requestTx || requestTx.type !== "WITHDRAW_REQUEST") {
      throw appError("NOT_FOUND", "Withdraw request not found");
    }

    if (actor.role.toUpperCase() === "CREATOR") {
      const wallet = await walletRepository.findByUserId(actor.id);
      if (!wallet || wallet.id !== requestTx.walletId) {
        throw appError("FORBIDDEN", "Not your withdrawal");
      }
    }

    const already = await prisma.transaction.findFirst({
      where: {
        walletId: requestTx.walletId,
        type: "WITHDRAW_SUCCESS",
        description: { contains: withdrawId }
      }
    });
    if (already) {
      return {
        alreadyCompleted: true,
        transaction: serializeTransaction(already)
      };
    }

    const amount = Number(requestTx.amount);
    const result = await walletRepository.applyLedgerUpdate({
      walletId: requestTx.walletId,
      withdrawDelta: amount,
      entries: [
        {
          type: "WITHDRAW_SUCCESS",
          amount,
          description: `Withdraw completed ref:${withdrawId}`
        }
      ]
    });

    return {
      alreadyCompleted: false,
      transaction: serializeTransaction(result.transactions[0]!),
      wallet: {
        totalWithdraw: Number(result.wallet.totalWithdraw),
        availableBalance: Number(result.wallet.availableBalance)
      }
    };
  }

  async failWithdraw(withdrawId: string, reason: string) {
    this.assertDb();
    const requestTx = await walletRepository.findTransaction(withdrawId);
    if (!requestTx || requestTx.type !== "WITHDRAW_REQUEST") {
      throw appError("NOT_FOUND", "Withdraw request not found");
    }

    const alreadySuccess = await prisma.transaction.findFirst({
      where: {
        walletId: requestTx.walletId,
        type: "WITHDRAW_SUCCESS",
        description: { contains: withdrawId }
      }
    });
    if (alreadySuccess) {
      return { alreadyFailed: false, alreadyCompleted: true };
    }

    const amount = Number(requestTx.amount);
    await walletRepository.applyLedgerUpdate({
      walletId: requestTx.walletId,
      availableDelta: amount,
      entries: [
        {
          type: "WITHDRAW_FAILED",
          amount,
          description: `Withdraw failed ref:${withdrawId} — ${reason}`
        }
      ]
    });

    return { alreadyFailed: false, alreadyCompleted: false };
  }

  /** Demo path — creator confirms payout locally without admin. */
  async demoCompleteOwnWithdraw(withdrawId: string, user: AuthUser) {
    if (!allowDemoWithdrawComplete()) {
      throw appError("FORBIDDEN", "Demo withdrawal completion is disabled in production");
    }
    return this.completeWithdraw(withdrawId, user);
  }
}

export const withdrawService = new WithdrawService();
