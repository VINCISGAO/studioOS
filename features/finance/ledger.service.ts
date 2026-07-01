import type {
  LedgerDirection,
  LedgerEntryType,
  PaymentChannel,
  WalletAssetCode
} from "@prisma/client";
import { ledgerRepository } from "@/features/finance/ledger.repository";
import {
  serializeLedgerEntry,
  serializeWalletAsset
} from "@/features/finance/finance.serializer";
import type {
  LedgerEntryView,
  PostLedgerEntryInput,
  WalletAssetView
} from "@/features/finance/finance.types";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

const FIAT_PRECISION = 2;
const CRYPTO_PRECISION = 8;

function isCryptoAsset(code: WalletAssetCode) {
  return ["USDT", "USDC", "BTC", "ETH", "TRX"].includes(code);
}

function roundAssetAmount(code: WalletAssetCode, value: number) {
  const precision = isCryptoAsset(code) ? CRYPTO_PRECISION : FIAT_PRECISION;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function assertPositiveAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw appError("VALIDATION_ERROR", "Amount must be greater than zero");
  }
}

export class LedgerService {
  isEnabled() {
    return hasDatabaseUrl();
  }

  private assertDb() {
    if (!this.isEnabled()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  async ensureAccount(userId: string) {
    this.assertDb();
    return ledgerRepository.getOrCreateAccount(userId);
  }

  async listAssets(userId: string): Promise<WalletAssetView[]> {
    this.assertDb();
    const account = await ledgerRepository.getOrCreateAccount(userId);
    const assets = await ledgerRepository.listAssets(account.id);
    return assets.map(serializeWalletAsset);
  }

  async getAsset(userId: string, assetCode: WalletAssetCode): Promise<WalletAssetView | null> {
    this.assertDb();
    const account = await ledgerRepository.getOrCreateAccount(userId);
    const asset = await ledgerRepository.findAsset(account.id, assetCode);
    return asset ? serializeWalletAsset(asset) : null;
  }

  async listLedger(
    userId: string,
    input?: {
      assetCode?: WalletAssetCode;
      entryType?: LedgerEntryType;
      limit?: number;
    }
  ): Promise<LedgerEntryView[]> {
    this.assertDb();
    const account = await ledgerRepository.getOrCreateAccount(userId);
    const rows = await ledgerRepository.listEntries(account.id, input);
    return rows.map(serializeLedgerEntry);
  }

  /** Single write path — all fund movements must go through here. */
  async postEntry(input: PostLedgerEntryInput) {
    this.assertDb();
    assertPositiveAmount(input.amount);

    const account = await ledgerRepository.getOrCreateAccount(input.userId);
    const amount = roundAssetAmount(input.assetCode, input.amount);

    const result = await ledgerRepository.postEntry({
      walletAccountId: account.id,
      assetCode: input.assetCode,
      entryType: input.entryType,
      direction: input.direction,
      amount,
      availableDelta: input.availableDelta,
      pendingDelta: input.pendingDelta,
      frozenDelta: input.frozenDelta,
      campaignId: input.campaignId,
      paymentMethodId: input.paymentMethodId,
      channel: input.channel,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      cryptoNetwork: input.cryptoNetwork,
      txHash: input.txHash,
      externalWalletAddress: input.externalWalletAddress,
      description: input.description,
      metadata: input.metadata
    });

    return {
      asset: serializeWalletAsset(result.asset),
      entry: serializeLedgerEntry(result.entry)
    };
  }

  async recordDeposit(input: {
    userId: string;
    assetCode: WalletAssetCode;
    amount: number;
    channel: PaymentChannel;
    campaignId?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    cryptoNetwork?: string | null;
    txHash?: string | null;
    externalWalletAddress?: string | null;
    description?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const amount = roundAssetAmount(input.assetCode, input.amount);
    return this.postEntry({
      userId: input.userId,
      assetCode: input.assetCode,
      entryType: "DEPOSIT",
      direction: "CREDIT",
      amount,
      availableDelta: amount,
      channel: input.channel,
      campaignId: input.campaignId,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      cryptoNetwork: input.cryptoNetwork,
      txHash: input.txHash,
      externalWalletAddress: input.externalWalletAddress,
      description: input.description ?? `Deposit via ${input.channel}`,
      metadata: input.metadata
    });
  }

  async recordWithdraw(input: {
    userId: string;
    assetCode: WalletAssetCode;
    amount: number;
    channel: PaymentChannel;
    paymentMethodId?: string | null;
    campaignId?: string | null;
    cryptoNetwork?: string | null;
    txHash?: string | null;
    externalWalletAddress?: string | null;
    description?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const amount = roundAssetAmount(input.assetCode, input.amount);
    return this.postEntry({
      userId: input.userId,
      assetCode: input.assetCode,
      entryType: "WITHDRAW",
      direction: "DEBIT",
      amount,
      availableDelta: -amount,
      channel: input.channel,
      paymentMethodId: input.paymentMethodId,
      campaignId: input.campaignId,
      cryptoNetwork: input.cryptoNetwork,
      txHash: input.txHash,
      externalWalletAddress: input.externalWalletAddress,
      description: input.description ?? `Withdraw via ${input.channel}`,
      metadata: input.metadata
    });
  }

  async recordEscrowLock(input: {
    userId: string;
    assetCode: WalletAssetCode;
    amount: number;
    campaignId: string;
    channel?: PaymentChannel;
    description?: string | null;
  }) {
    const amount = roundAssetAmount(input.assetCode, input.amount);
    return this.postEntry({
      userId: input.userId,
      assetCode: input.assetCode,
      entryType: "ESCROW_LOCK",
      direction: "DEBIT",
      amount,
      availableDelta: -amount,
      frozenDelta: amount,
      campaignId: input.campaignId,
      channel: input.channel ?? "INTERNAL",
      description: input.description ?? "Escrow lock"
    });
  }

  async recordEscrowRelease(input: {
    userId: string;
    assetCode: WalletAssetCode;
    amount: number;
    campaignId: string;
    channel?: PaymentChannel;
    description?: string | null;
  }) {
    const amount = roundAssetAmount(input.assetCode, input.amount);
    return this.postEntry({
      userId: input.userId,
      assetCode: input.assetCode,
      entryType: "ESCROW_RELEASE",
      direction: "CREDIT",
      amount,
      frozenDelta: -amount,
      availableDelta: amount,
      campaignId: input.campaignId,
      channel: input.channel ?? "INTERNAL",
      description: input.description ?? "Escrow release"
    });
  }

  async recordSettlement(input: {
    userId: string;
    assetCode: WalletAssetCode;
    grossAmount: number;
    netAmount: number;
    commissionAmount: number;
    campaignId: string;
    channel?: PaymentChannel;
    description?: string | null;
  }) {
    const gross = roundAssetAmount(input.assetCode, input.grossAmount);
    const net = roundAssetAmount(input.assetCode, input.netAmount);
    const commission = roundAssetAmount(input.assetCode, input.commissionAmount);

    const release = await this.postEntry({
      userId: input.userId,
      assetCode: input.assetCode,
      entryType: "SETTLEMENT",
      direction: "CREDIT",
      amount: net,
      pendingDelta: -gross,
      availableDelta: net,
      campaignId: input.campaignId,
      channel: input.channel ?? "INTERNAL",
      description: input.description ?? "Campaign settlement"
    });

    if (commission > 0) {
      await this.postEntry({
        userId: input.userId,
        assetCode: input.assetCode,
        entryType: "COMMISSION",
        direction: "DEBIT",
        amount: commission,
        availableDelta: 0,
        pendingDelta: 0,
        frozenDelta: 0,
        campaignId: input.campaignId,
        channel: input.channel ?? "INTERNAL",
        description: "Platform commission at settlement",
        metadata: { grossAmount: gross, netAmount: net }
      });
    }

    return release;
  }

  async recordCommission(input: {
    userId: string;
    assetCode: WalletAssetCode;
    amount: number;
    campaignId?: string | null;
    channel?: PaymentChannel;
    description?: string | null;
  }) {
    const amount = roundAssetAmount(input.assetCode, input.amount);
    return this.postEntry({
      userId: input.userId,
      assetCode: input.assetCode,
      entryType: "COMMISSION",
      direction: "DEBIT",
      amount,
      availableDelta: -amount,
      campaignId: input.campaignId,
      channel: input.channel ?? "INTERNAL",
      description: input.description ?? "Commission"
    });
  }

  async recordRefund(input: {
    userId: string;
    assetCode: WalletAssetCode;
    amount: number;
    campaignId?: string | null;
    channel: PaymentChannel;
    referenceType?: string | null;
    referenceId?: string | null;
    description?: string | null;
  }) {
    const amount = roundAssetAmount(input.assetCode, input.amount);
    return this.postEntry({
      userId: input.userId,
      assetCode: input.assetCode,
      entryType: "REFUND",
      direction: "CREDIT",
      amount,
      availableDelta: amount,
      campaignId: input.campaignId,
      channel: input.channel,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      description: input.description ?? "Refund"
    });
  }

  async recordManualAdjustment(input: {
    userId: string;
    assetCode: WalletAssetCode;
    amount: number;
    direction: LedgerDirection;
    availableDelta?: number;
    pendingDelta?: number;
    frozenDelta?: number;
    description: string;
    metadata?: Record<string, unknown>;
  }) {
    const amount = roundAssetAmount(input.assetCode, input.amount);
    return this.postEntry({
      userId: input.userId,
      assetCode: input.assetCode,
      entryType: "MANUAL_ADJUSTMENT",
      direction: input.direction,
      amount,
      availableDelta: input.availableDelta,
      pendingDelta: input.pendingDelta,
      frozenDelta: input.frozenDelta,
      channel: "MANUAL_OFFLINE",
      description: input.description,
      metadata: input.metadata
    });
  }
}

export const ledgerService = new LedgerService();
