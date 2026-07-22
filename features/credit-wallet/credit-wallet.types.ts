import type {
  CreditPackage,
  CreditPurchaseOrder,
  CreditReservation,
  CreditTransaction,
  CreditWallet,
  CreatorEarningWallet
} from "@prisma/client";

export type CreditWalletRecord = CreditWallet;
export type CreditTransactionRecord = CreditTransaction;
export type CreditPackageRecord = CreditPackage;
export type CreditPurchaseOrderRecord = CreditPurchaseOrder;
export type CreditReservationRecord = CreditReservation;
export type CreatorEarningWalletRecord = CreatorEarningWallet;

export type CreditWalletSummary = {
  availableCredits: number;
  reservedCredits: number;
  totalCredits: number;
  lifetimePurchased: number;
  lifetimeBonus: number;
  lifetimeSpent: number;
  lifetimeRefunded: number;
  monthSpent: number;
  expiringCredits: number;
};

export type CreditWalletDashboard = CreditWalletSummary & {
  earningAvailableMinor: number;
  earningCurrency: string;
  accountNetDisplay: string;
  recentTransactions: CreditTransactionView[];
};

export type CreditTransactionView = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  source: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type CreditPackageView = {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  currency: string;
  amountMinor: number;
  displayPrice: string;
};

export type ResolvedCreditPackageView = CreditPackageView & {
  regionCode: string;
  matchedRegion: string;
  pricingSource: "REGION_EXACT" | "GLOBAL_FALLBACK";
  globalFallbackUsed: boolean;
  regionalPriceId: string;
  stripePriceId: string | null;
};

export type CreditPurchaseOrderView = {
  id: string;
  packageId: string | null;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  currency: string;
  amountMinor: number;
  displayPrice: string;
  status: string;
  providerSessionId: string | null;
  paidAt: string | null;
  creditedAt: string | null;
  cancelledAt: string | null;
  failedAt: string | null;
  createdAt: string;
};

export type ReserveCreditsInput = {
  userId: string;
  amount: number;
  idempotencyKey: string;
  pricingSnapshot?: Record<string, unknown>;
  generationJobId?: string;
  description?: string;
};

export type CreditCustomPurchaseTermsView = {
  minCredits: number;
  maxCredits: number;
  currency: string;
  referencePackageName: string;
  referenceBaseCredits: number;
  referenceAmountMinor: number;
  displayUnitPrice: string;
};

export type CreditPurchaseCheckoutInput = {
  userId: string;
  packageId?: string;
  customCredits?: number;
  idempotencyKey: string;
};

export type EarningConversionInput = {
  userId: string;
  earningAmountMinor: number;
  idempotencyKey: string;
};

export type EarningConversionView = {
  id: string;
  earningAmountMinor: number;
  earningDisplay: string;
  creditsGranted: number;
  currency: string;
  exchangeRateSnapshot: Record<string, unknown> | null;
  earningTransactionId: string | null;
  creditTransactionId: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type EarningConversionQuote = {
  earningAmountMinor: number;
  displayAmountMinor: number;
  displayCurrency: string;
  earningAvailableMinor: number;
  earningAvailableUsdMinor: number;
  creditsGranted: number;
  exchangeRateSnapshot: {
    currency: string;
    creditsPerUnitMinor: number;
    proBonusPercent: number;
    promoBonusPercent: number;
    quotedAt: string;
  };
  irreversible: true;
};
