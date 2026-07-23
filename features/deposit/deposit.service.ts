import {
  CREATOR_DEPOSIT_AMOUNT_MINOR,
  CREATOR_DEPOSIT_CURRENCY,
  depositAmountUsdFromMinor
} from "@/features/deposit/deposit.constants";
import { depositReconcileService } from "@/features/deposit/deposit-reconcile.service";
import { depositRepository, mapDepositPaymentRow } from "@/features/deposit/deposit.repository";
import { CREATOR_DEPOSIT_USD } from "@/lib/studioos/deposit-copy";
import type {
  CreatorDepositOverlay,
  CreatorDepositSnapshot,
  DepositPayment
} from "@/lib/studioos/deposit-types";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { assertProductionDepositDatabase, isDemoDepositPaymentsEnabled } from "@/lib/deposit/deposit-env";
import type Stripe from "stripe";

export type AdminDepositRow = {
  id: string;
  legacyCreatorId: string;
  creatorProfileId: string | null;
  amount: number;
  status: string;
  reason: string | null;
  refundableAfter: string | null;
};

function toLegacyCreatorKey(
  identity: NonNullable<Awaited<ReturnType<typeof depositRepository.resolveIdentity>>>
) {
  return identity.legacyCreatorId ?? identity.creatorProfileId;
}

async function maybeAdvanceDemoPayments(accountId: string, legacyKey: string) {
  if (!isDemoDepositPaymentsEnabled()) {
    return null;
  }
  const { advanceDemoDepositPayments } = await import("@/lib/deposit/demo-deposit-payments");
  return advanceDemoDepositPayments(accountId, legacyKey);
}

export class DepositService {
  isEnabled() {
    return depositRepository.isEnabled();
  }

  private ensureDatabase() {
    assertProductionDepositDatabase();
  }

  async verifyDepositOwnership(authenticatedUserId: string, metadataCreatorId: string) {
    const authIdentity = await depositRepository.resolveIdentity(authenticatedUserId);
    const metadataIdentity = await depositRepository.resolveIdentity(metadataCreatorId);
    if (!authIdentity || !metadataIdentity) return false;
    return authIdentity.userId === metadataIdentity.userId;
  }

  async getCreatorDepositOverlay(creatorKey: string): Promise<CreatorDepositOverlay | null> {
    this.ensureDatabase();
    const identity = await depositRepository.resolveIdentity(creatorKey);
    if (!identity) return null;

    const account = await depositRepository.getOrCreateAccount(identity);
    await maybeAdvanceDemoPayments(account.id, toLegacyCreatorKey(identity));

    const refreshed = await depositRepository.findAccountByKey(creatorKey);
    if (!refreshed) return null;

    return {
      deposit_status: refreshed.depositStatus === "PAID" ? "paid" : "unpaid",
      deposit_amount: Number(refreshed.depositAmountUsd) || CREATOR_DEPOSIT_USD,
      paid_at: refreshed.paidAt?.toISOString() ?? null
    };
  }

  async listAdminDepositRows(): Promise<AdminDepositRow[]> {
    this.ensureDatabase();
    const accounts = await depositRepository.listAdminAccounts();
    return accounts.map((account) => ({
      id: account.id,
      legacyCreatorId: account.legacyCreatorId ?? account.creatorProfileId,
      creatorProfileId: account.creatorProfileId,
      amount: Number(account.depositAmountUsd) || CREATOR_DEPOSIT_USD,
      status: account.depositStatus === "PAID" ? "paid" : "unpaid",
      reason:
        account.depositStatus === "PAID"
          ? "Paid studio guarantee deposit"
          : "Required before accepting orders",
      refundableAfter: account.paidAt?.toISOString() ?? null
    }));
  }

  async getCreatorDepositSnapshot(creatorKey: string): Promise<CreatorDepositSnapshot | null> {
    this.ensureDatabase();
    const identity = await depositRepository.resolveIdentity(creatorKey);
    if (!identity) return null;

    const account = await depositRepository.getOrCreateAccount(identity);
    await maybeAdvanceDemoPayments(account.id, toLegacyCreatorKey(identity));

    const refreshed = await depositRepository.findAccountByKey(creatorKey);
    if (!refreshed) return null;

    return depositRepository.mapAccountSnapshot(refreshed, toLegacyCreatorKey(identity));
  }

  async submitDepositPayment(
    creatorKey: string,
    input: {
      payment_method: PayoutMethodType;
      payment_reference?: string;
      locale: "en" | "zh";
    }
  ): Promise<{ ok: true; payment: DepositPayment } | { ok: false; error: string }> {
    this.ensureDatabase();

    if (!isDemoDepositPaymentsEnabled()) {
      return {
        ok: false,
        error:
          input.locale === "zh"
            ? "请使用 Stripe 安全收银台完成保证金付款"
            : "Please complete the deposit via Stripe checkout"
      };
    }

    const identity = await depositRepository.resolveIdentity(creatorKey);
    if (!identity) {
      return { ok: false, error: input.locale === "zh" ? "创作者账户无效" : "Invalid creator account" };
    }

    const account = await depositRepository.getOrCreateAccount(identity);
    if (account.depositStatus === "PAID") {
      return {
        ok: false,
        error: input.locale === "zh" ? "保证金已缴纳" : "Deposit already paid"
      };
    }

    const pending = await depositRepository.findActivePayment(account.id);
    if (pending) {
      return {
        ok: false,
        error:
          input.locale === "zh"
            ? "已有待确认的保证金付款"
            : "A deposit payment is already pending review"
      };
    }

    const payment = await depositRepository.createPayment({
      accountId: account.id,
      userId: identity.userId,
      paymentMethod: input.payment_method,
      paymentReference: input.payment_reference
    });

    await maybeAdvanceDemoPayments(account.id, toLegacyCreatorKey(identity));

    return {
      ok: true,
      payment: mapDepositPaymentRow(payment, toLegacyCreatorKey(identity))
    };
  }

  async createDepositStripePayment(creatorKey: string) {
    this.ensureDatabase();

    const identity = await depositRepository.resolveIdentity(creatorKey);
    if (!identity) {
      return { ok: false as const, error: "Invalid creator account" };
    }

    const account = await depositRepository.getOrCreateAccount(identity);
    if (account.depositStatus === "PAID") {
      return { ok: false as const, error: "Deposit already paid" };
    }

    const existingPending = await depositRepository.findActivePayment(account.id);
    if (existingPending) {
      return {
        ok: true as const,
        payment: mapDepositPaymentRow(existingPending, toLegacyCreatorKey(identity)),
        amountUsd: depositAmountUsdFromMinor(existingPending.amountMinor),
        amountMinor: existingPending.amountMinor,
        currency: existingPending.currency
      };
    }

    const payment = await depositRepository.createPayment({
      accountId: account.id,
      userId: identity.userId,
      paymentMethod: "bank_wire",
      paymentReference: "stripe_checkout",
      idempotencyKey: `deposit:${identity.userId}:${CREATOR_DEPOSIT_AMOUNT_MINOR}:${CREATOR_DEPOSIT_CURRENCY}`
    });

    return {
      ok: true as const,
      payment: mapDepositPaymentRow(payment, toLegacyCreatorKey(identity)),
      amountUsd: depositAmountUsdFromMinor(CREATOR_DEPOSIT_AMOUNT_MINOR),
      amountMinor: CREATOR_DEPOSIT_AMOUNT_MINOR,
      currency: CREATOR_DEPOSIT_CURRENCY
    };
  }

  async attachDepositStripeSession(input: {
    creatorId: string;
    paymentId: string;
    stripeSessionId: string;
  }) {
    this.ensureDatabase();
    const identity = await depositRepository.resolveIdentity(input.creatorId);
    if (!identity) return false;
    const account = await depositRepository.getOrCreateAccount(identity);
    return depositRepository.attachStripeSession(input.paymentId, account.id, input.stripeSessionId);
  }

  async attachDepositStripePaymentIntent(input: {
    creatorId: string;
    paymentId: string;
    stripePaymentIntentId: string;
  }) {
    this.ensureDatabase();
    const identity = await depositRepository.resolveIdentity(input.creatorId);
    if (!identity) return false;
    const account = await depositRepository.getOrCreateAccount(identity);
    return depositRepository.attachStripePaymentIntent(
      input.paymentId,
      account.id,
      input.stripePaymentIntentId
    );
  }

  async confirmCreatorDepositFromStripe(input: {
    creatorId: string;
    paymentId: string;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    amountMinor: number;
    currency: string;
  }) {
    this.ensureDatabase();

    if (input.stripePaymentIntentId) {
      const { getStripe } = await import("@/lib/stripe");
      const intent = await getStripe().paymentIntents.retrieve(input.stripePaymentIntentId);
      const result = await depositReconcileService.reconcilePaymentIntent({
        intent: intent as Stripe.PaymentIntent,
        stripeSessionId: input.stripeSessionId
      });
      return {
        duplicate: result.duplicate ?? false,
        paymentId: result.paymentId ?? input.paymentId,
        creatorId: result.creatorId ?? input.creatorId
      };
    }

    const identity = await depositRepository.resolveIdentity(input.creatorId);
    if (!identity) {
      throw new Error("Creator account not found");
    }

    const account = await depositRepository.getOrCreateAccount(identity);
    const result = await depositRepository.confirmPayment({
      accountId: account.id,
      paymentId: input.paymentId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      stripeSessionId: input.stripeSessionId,
      stripePaymentIntentId: input.stripePaymentIntentId
    });

    if (!result.duplicate) {
      const { ensureCertificationFormAndMessage } = await import(
        "@/lib/studioos/certification-form-notify"
      );
      await ensureCertificationFormAndMessage({
        creatorId: toLegacyCreatorKey(identity),
        depositPaymentId: result.payment.id
      }).catch(() => undefined);
    }

    return {
      duplicate: result.duplicate,
      paymentId: result.payment.id,
      creatorId: toLegacyCreatorKey(identity)
    };
  }

  async reconcilePaymentIntentForUser(paymentIntentId: string, authenticatedUserId: string) {
    this.ensureDatabase();
    const { getStripe } = await import("@/lib/stripe");
    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    return depositReconcileService.reconcilePaymentIntent({
      intent,
      authenticatedUserId
    });
  }
}

export const depositService = new DepositService();
