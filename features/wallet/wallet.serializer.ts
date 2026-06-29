import type { Transaction, Wallet } from "@prisma/client";

export function serializeWallet(wallet: Wallet) {
  return {
    id: wallet.id,
    userId: wallet.userId,
    currency: wallet.currency,
    availableBalance: Number(wallet.availableBalance),
    pendingBalance: Number(wallet.pendingBalance),
    totalEarned: Number(wallet.totalEarned),
    totalWithdraw: Number(wallet.totalWithdraw),
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString()
  };
}

export function serializeTransaction(tx: Transaction) {
  return {
    id: tx.id,
    walletId: tx.walletId,
    campaignId: tx.campaignId,
    type: tx.type,
    amount: Number(tx.amount),
    balanceAfter: Number(tx.balanceAfter),
    description: tx.description,
    createdAt: tx.createdAt.toISOString()
  };
}
