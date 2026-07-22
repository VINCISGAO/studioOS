import type { Transaction, TransactionType, Wallet } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export class WalletRepository {
  async findByUserId(userId: string): Promise<Wallet | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.wallet.findUnique({ where: { userId } });
  }

  async getOrCreate(userId: string, currency = "USD"): Promise<Wallet> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    return prisma.wallet.create({
      data: { userId, currency }
    });
  }

  async listTransactions(walletId: string, limit = 50): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  async findTransaction(id: string) {
    return prisma.transaction.findUnique({ where: { id } });
  }

  async applyLedgerUpdate(input: {
    walletId: string;
    campaignId?: string;
    entries: Array<{
      type: TransactionType;
      amount: number;
      description?: string;
      balanceAfter?: number;
    }>;
    pendingDelta?: number;
    availableDelta?: number;
    earnedDelta?: number;
    withdrawDelta?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: input.walletId } });

      const pending = Number(wallet.pendingBalance) + (input.pendingDelta ?? 0);
      const available = Number(wallet.availableBalance) + (input.availableDelta ?? 0);
      const totalEarned = Number(wallet.totalEarned) + (input.earnedDelta ?? 0);
      const totalWithdraw = Number(wallet.totalWithdraw) + (input.withdrawDelta ?? 0);

      if (pending < 0 || available < 0) {
        throw new Error("Wallet balance cannot go negative");
      }

      const updated = await tx.wallet.update({
        where: { id: input.walletId },
        data: {
          pendingBalance: pending,
          availableBalance: available,
          totalEarned,
          totalWithdraw
        }
      });

      const transactions: Transaction[] = [];
      for (const entry of input.entries) {
        const created = await tx.transaction.create({
          data: {
            walletId: input.walletId,
            campaignId: input.campaignId,
            type: entry.type,
            amount: entry.amount,
            balanceAfter: entry.balanceAfter ?? Number(updated.availableBalance),
            description: entry.description
          }
        });
        transactions.push(created);
      }

      return { wallet: updated, transactions };
    });
  }

  async creditBrandWalletRechargeOnce(input: {
    walletId: string;
    sessionId: string;
    amount: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: {
          walletId: input.walletId,
          type: "ESCROW_DEPOSIT",
          description: { contains: `(${input.sessionId})` }
        }
      });
      if (existing) {
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: input.walletId } });
        return { duplicate: true as const, wallet };
      }

      const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: input.walletId } });
      const available = Number(wallet.availableBalance) + input.amount;
      if (available < 0) {
        throw new Error("Wallet balance cannot go negative");
      }

      const updated = await tx.wallet.update({
        where: { id: input.walletId },
        data: { availableBalance: available }
      });

      await tx.transaction.create({
        data: {
          walletId: input.walletId,
          type: "ESCROW_DEPOSIT",
          amount: input.amount,
          balanceAfter: available,
          description: `Stripe wallet recharge (${input.sessionId})`
        }
      });

      return { duplicate: false as const, wallet: updated };
    });
  }
}

export const walletRepository = new WalletRepository();
