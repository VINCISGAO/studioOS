import type {
  LedgerEntry,
  PaymentChannel,
  PaymentMethod,
  WalletAsset,
  WalletAssetCode
} from "@prisma/client";
import type {
  LedgerEntryView,
  PaymentMethodView,
  WalletAssetView
} from "@/features/finance/finance.types";

function toNumber(value: { toString(): string } | number): number {
  return Number(value);
}

export function serializeWalletAsset(asset: WalletAsset): WalletAssetView {
  return {
    assetCode: asset.assetCode,
    availableBalance: toNumber(asset.availableBalance),
    pendingBalance: toNumber(asset.pendingBalance),
    frozenBalance: toNumber(asset.frozenBalance),
    updatedAt: asset.updatedAt.toISOString()
  };
}

export function serializeLedgerEntry(entry: LedgerEntry): LedgerEntryView {
  return {
    id: entry.id,
    assetCode: entry.assetCode,
    entryType: entry.entryType,
    direction: entry.direction,
    amount: toNumber(entry.amount),
    availableAfter: toNumber(entry.availableAfter),
    pendingAfter: toNumber(entry.pendingAfter),
    frozenAfter: toNumber(entry.frozenAfter),
    campaignId: entry.campaignId,
    paymentMethodId: entry.paymentMethodId,
    channel: entry.channel,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    cryptoNetwork: entry.cryptoNetwork,
    txHash: entry.txHash,
    externalWalletAddress: entry.externalWalletAddress,
    description: entry.description,
    createdAt: entry.createdAt.toISOString()
  };
}

export function serializePaymentMethod(method: PaymentMethod): PaymentMethodView {
  return {
    id: method.id,
    type: method.type,
    provider: method.provider,
    accountName: method.accountName,
    accountNumber: method.accountNumber,
    accountEmail: method.accountEmail,
    walletAddress: method.walletAddress,
    network: method.network,
    currency: method.currency,
    isDefault: method.isDefault,
    status: method.status,
    createdAt: method.createdAt.toISOString(),
    updatedAt: method.updatedAt.toISOString()
  };
}

export function maskAccountNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 4) return value;
  return `••••${value.slice(-4)}`;
}

export function channelLabel(channel: PaymentChannel | null, locale: "en" | "zh" = "en"): string {
  const labels: Record<PaymentChannel, { en: string; zh: string }> = {
    STRIPE: { en: "Stripe", zh: "Stripe" },
    PAYPAL: { en: "PayPal", zh: "PayPal" },
    WISE: { en: "Wise", zh: "Wise" },
    BANK_TRANSFER: { en: "Bank transfer", zh: "银行转账" },
    ALIPAY: { en: "Alipay", zh: "支付宝" },
    WECHAT_PAY: { en: "WeChat Pay", zh: "微信支付" },
    ABA_LOCAL_BANK: { en: "Local bank (ABA)", zh: "本地银行" },
    MANUAL_OFFLINE: { en: "Manual offline", zh: "线下人工" },
    CRYPTO_ONCHAIN: { en: "On-chain crypto", zh: "链上加密货币" },
    INTERNAL: { en: "Internal", zh: "系统内部" }
  };
  if (!channel) return locale === "zh" ? "未知" : "Unknown";
  return labels[channel][locale];
}
