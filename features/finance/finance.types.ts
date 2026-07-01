import type {
  LedgerDirection,
  LedgerEntry,
  LedgerEntryType,
  PaymentChannel,
  PaymentMethod,
  PaymentMethodProvider,
  PaymentMethodStatus,
  PaymentMethodType,
  WalletAccount,
  WalletAsset,
  WalletAssetCode
} from "@prisma/client";

export type WalletAssetView = {
  assetCode: WalletAssetCode;
  availableBalance: number;
  pendingBalance: number;
  frozenBalance: number;
  updatedAt: string;
};

export type LedgerEntryView = {
  id: string;
  assetCode: WalletAssetCode;
  entryType: LedgerEntryType;
  direction: LedgerDirection;
  amount: number;
  availableAfter: number;
  pendingAfter: number;
  frozenAfter: number;
  campaignId: string | null;
  paymentMethodId: string | null;
  channel: PaymentChannel | null;
  referenceType: string | null;
  referenceId: string | null;
  cryptoNetwork: string | null;
  txHash: string | null;
  externalWalletAddress: string | null;
  description: string | null;
  createdAt: string;
};

export type PaymentMethodView = {
  id: string;
  type: PaymentMethodType;
  provider: PaymentMethodProvider;
  accountName: string | null;
  accountNumber: string | null;
  accountEmail: string | null;
  walletAddress: string | null;
  network: string | null;
  currency: WalletAssetCode;
  isDefault: boolean;
  status: PaymentMethodStatus;
  createdAt: string;
  updatedAt: string;
};

export type PostLedgerEntryInput = {
  userId: string;
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

export type WalletAccountWithAssets = WalletAccount & {
  assets: WalletAsset[];
};

export type LedgerEntryWithRelations = LedgerEntry & {
  paymentMethod?: PaymentMethod | null;
};

export const FIAT_ASSET_CODES: WalletAssetCode[] = ["USD", "CNY", "EUR"];

export const CRYPTO_ASSET_CODES: WalletAssetCode[] = ["USDT", "USDC", "BTC", "ETH", "TRX"];

export const DEFAULT_WALLET_ASSETS: WalletAssetCode[] = [...FIAT_ASSET_CODES, ...CRYPTO_ASSET_CODES];
