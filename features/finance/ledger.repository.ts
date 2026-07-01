import type {
  LedgerDirection,
  LedgerEntry,
  LedgerEntryType,
  PaymentChannel,
  Prisma,
  WalletAccount,
  WalletAsset,
  WalletAssetCode
} from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import { DEFAULT_WALLET_ASSETS } from "@/features/finance/finance.types";

export type LedgerPostInput = {
  walletAccountId: string;
  assetCode: WalletAssetCode;
  entryType: LedgerEntryType;
  direction: LedgerDirection;
  amount: number;
  availableDelta?: number;
  pendingDelta?: number;
  frozenDelta?: number;
  campaignId?: string | null;
  paymentMethodId?: string | null;
  channel?: PaymentChannel | null;
  referenceType?: string | null;
  referenceId?: string | null;
  cryptoNetwork?: string | null;
  txHash?: string | null;
  externalWalletAddress?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
};

export class LedgerRepository {
  private assertDb() {
    if (!hasDatabaseUrl()) throw new Error("DATABASE_URL not configured");
  }

  async findAccountByUserId(userId: string): Promise<WalletAccount | null> {
    this.assertDb();
    return prisma.walletAccount.findUnique({ where: { userId } });
  }

  async getOrCreateAccount(userId: string): Promise<WalletAccount> {
    this.assertDb();
    const existing = await this.findAccountByUserId(userId);
    if (existing) {
      await this.ensureDefaultAssets(existing.id);
      return existing;
    }

    return prisma.$transaction(async (tx) => {
      const account = await tx.walletAccount.create({
        data: { userId }
      });

      await tx.walletAsset.createMany({
        data: DEFAULT_WALLET_ASSETS.map((assetCode) => ({
          walletAccountId: account.id,
          assetCode
        }))
      });

      return account;
    });
  }

  async ensureDefaultAssets(walletAccountId: string) {
    this.assertDb();
    const existing = await prisma.walletAsset.findMany({
      where: { walletAccountId },
      select: { assetCode: true }
    });
    const existingCodes = new Set(existing.map((row) => row.assetCode));
    const missing = DEFAULT_WALLET_ASSETS.filter((code) => !existingCodes.has(code));
    if (!missing.length) return;

    await prisma.walletAsset.createMany({
      data: missing.map((assetCode) => ({ walletAccountId, assetCode }))
    });
  }

  async listAssets(walletAccountId: string): Promise<WalletAsset[]> {
    this.assertDb();
    return prisma.walletAsset.findMany({
      where: { walletAccountId },
      orderBy: { assetCode: "asc" }
    });
  }

  async findAsset(walletAccountId: string, assetCode: WalletAssetCode) {
    this.assertDb();
    return prisma.walletAsset.findUnique({
      where: {
        walletAccountId_assetCode: { walletAccountId, assetCode }
      }
    });
  }

  async listEntries(
    walletAccountId: string,
    input?: {
      assetCode?: WalletAssetCode;
      entryType?: LedgerEntryType;
      limit?: number;
      cursor?: string;
    }
  ): Promise<LedgerEntry[]> {
    this.assertDb();
    return prisma.ledgerEntry.findMany({
      where: {
        walletAccountId,
        ...(input?.assetCode ? { assetCode: input.assetCode } : {}),
        ...(input?.entryType ? { entryType: input.entryType } : {})
      },
      orderBy: { createdAt: "desc" },
      take: input?.limit ?? 50,
      ...(input?.cursor ? { skip: 1, cursor: { id: input.cursor } } : {})
    });
  }

  async findEntryById(id: string) {
    this.assertDb();
    return prisma.ledgerEntry.findUnique({ where: { id } });
  }

  async postEntry(input: LedgerPostInput): Promise<{ asset: WalletAsset; entry: LedgerEntry }> {
    this.assertDb();

    return prisma.$transaction(async (tx) => {
      const asset = await tx.walletAsset.findUniqueOrThrow({
        where: {
          walletAccountId_assetCode: {
            walletAccountId: input.walletAccountId,
            assetCode: input.assetCode
          }
        }
      });

      const available =
        Number(asset.availableBalance) + (input.availableDelta ?? 0);
      const pending = Number(asset.pendingBalance) + (input.pendingDelta ?? 0);
      const frozen = Number(asset.frozenBalance) + (input.frozenDelta ?? 0);

      if (available < 0 || pending < 0 || frozen < 0) {
        throw new Error("Wallet asset balance cannot go negative");
      }

      const updated = await tx.walletAsset.update({
        where: { id: asset.id },
        data: {
          availableBalance: available,
          pendingBalance: pending,
          frozenBalance: frozen
        }
      });

      const entry = await tx.ledgerEntry.create({
        data: {
          walletAccountId: input.walletAccountId,
          assetCode: input.assetCode,
          entryType: input.entryType,
          direction: input.direction,
          amount: input.amount,
          availableAfter: available,
          pendingAfter: pending,
          frozenAfter: frozen,
          campaignId: input.campaignId ?? null,
          paymentMethodId: input.paymentMethodId ?? null,
          channel: input.channel ?? null,
          referenceType: input.referenceType ?? null,
          referenceId: input.referenceId ?? null,
          cryptoNetwork: input.cryptoNetwork ?? null,
          txHash: input.txHash ?? null,
          externalWalletAddress: input.externalWalletAddress ?? null,
          description: input.description ?? null,
          metadataJson: input.metadata as Prisma.InputJsonValue | undefined
        }
      });

      return { asset: updated, entry };
    });
  }
}

export const ledgerRepository = new LedgerRepository();
