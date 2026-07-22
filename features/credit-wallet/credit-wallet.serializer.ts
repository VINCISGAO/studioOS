import type { CreditPackage, CreditPurchaseOrder, CreditTransaction, EarningToCreditConversion } from "@prisma/client";
import { formatAmountMinor } from "@/lib/credits/currency-minor-units";
import type {
  CreditPackageView,
  CreditPurchaseOrderView,
  CreditTransactionView,
  CreditWalletSummary,
  EarningConversionView,
  ResolvedCreditPackageView
} from "@/features/credit-wallet/credit-wallet.types";

function formatUsdMinor(amountMinor: number) {
  return formatAmountMinor("USD", amountMinor);
}

export function serializeCreditTransaction(row: CreditTransaction): CreditTransactionView {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    balanceAfter: row.balanceAfter,
    source: row.source,
    description: row.description,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    createdAt: row.createdAt.toISOString()
  };
}

export function serializeCreditPackage(row: CreditPackage): CreditPackageView {
  return {
    id: row.id,
    name: row.name,
    credits: row.credits,
    bonusCredits: row.bonusCredits,
    totalCredits: row.credits + row.bonusCredits,
    currency: row.currency,
    amountMinor: row.amountMinor,
    displayPrice: formatAmountMinor(row.currency, row.amountMinor)
  };
}

export function serializeResolvedCreditPackage(input: ResolvedCreditPackageView): ResolvedCreditPackageView {
  return input;
}

export function serializeCreditPurchaseOrder(row: CreditPurchaseOrder): CreditPurchaseOrderView {
  return {
    id: row.id,
    packageId: row.packageId,
    credits: row.credits,
    bonusCredits: row.bonusCredits,
    totalCredits: row.credits + row.bonusCredits,
    currency: row.currency,
    amountMinor: row.amountMinor,
    displayPrice: formatAmountMinor(row.currency, row.amountMinor),
    status: row.status,
    providerSessionId: row.providerSessionId,
    paidAt: row.paidAt?.toISOString() ?? null,
    creditedAt: row.creditedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}

export function serializeCreditWalletSummary(input: {
  wallet: {
    availableCredits: number;
    reservedCredits: number;
    lifetimePurchased: number;
    lifetimeBonus: number;
    lifetimeSpent: number;
    lifetimeRefunded: number;
  };
  monthSpent: number;
  expiringCredits: number;
}): CreditWalletSummary {
  return {
    availableCredits: input.wallet.availableCredits,
    reservedCredits: input.wallet.reservedCredits,
    totalCredits: input.wallet.availableCredits + input.wallet.reservedCredits,
    lifetimePurchased: input.wallet.lifetimePurchased,
    lifetimeBonus: input.wallet.lifetimeBonus,
    lifetimeSpent: input.wallet.lifetimeSpent,
    lifetimeRefunded: input.wallet.lifetimeRefunded,
    monthSpent: input.monthSpent,
    expiringCredits: input.expiringCredits
  };
}

export function serializeEarningConversion(row: EarningToCreditConversion): EarningConversionView {
  const snapshot = row.exchangeRateSnapshot as Record<string, unknown> | null;
  return {
    id: row.id,
    earningAmountMinor: row.earningAmountMinor,
    earningDisplay: formatUsdMinor(row.earningAmountMinor),
    creditsGranted: row.creditsGranted,
    currency: row.currency,
    exchangeRateSnapshot: snapshot,
    earningTransactionId: row.earningTransactionId,
    creditTransactionId: row.creditTransactionId,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}
