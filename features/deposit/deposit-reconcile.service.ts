import "server-only";

import type Stripe from "stripe";
import {
  CREATOR_DEPOSIT_AMOUNT_MINOR,
  CREATOR_DEPOSIT_CURRENCY,
  depositAmountUsdFromMinor
} from "@/features/deposit/deposit.constants";
import { depositRepository } from "@/features/deposit/deposit.repository";
import { appError } from "@/lib/core/errors";
import { logger } from "@/lib/core/logger";

type ReconcileInput = {
  intent: Stripe.PaymentIntent;
  authenticatedUserId?: string;
  stripeSessionId?: string;
};

function readIntentMinor(intent: Stripe.PaymentIntent) {
  return intent.amount_received ?? intent.amount ?? 0;
}

function readIntentCurrency(intent: Stripe.PaymentIntent) {
  return (intent.currency ?? "usd").toUpperCase();
}

export class DepositReconcileService {
  private async assertOwnership(input: ReconcileInput) {
    const metadataCreatorId = input.intent.metadata?.creator_id?.trim();
    const paymentId = input.intent.metadata?.payment_id?.trim();
    const paymentIntentId = input.intent.id;

    if (!metadataCreatorId || !paymentId) {
      throw appError("VALIDATION_ERROR", "Missing deposit metadata");
    }

    const payment =
      (await depositRepository.findByStripePaymentIntentId(paymentIntentId)) ??
      (await depositRepository.findPaymentById(paymentId));

    if (!payment) {
      throw appError("NOT_FOUND", "Deposit payment not found");
    }

    const account = await depositRepository.findAccountById(payment.accountId);
    if (!account) {
      throw appError("NOT_FOUND", "Deposit payment not found");
    }

    if (input.authenticatedUserId) {
      if (account.userId !== input.authenticatedUserId) {
        logger.warn("Deposit reconcile ownership mismatch", {
          service: "DepositReconcileService",
          paymentIntentId,
          authenticatedUserId: input.authenticatedUserId
        });
        throw appError("NOT_FOUND", "Deposit payment not found");
      }

      const metadataIdentity = await depositRepository.resolveIdentity(metadataCreatorId);
      if (!metadataIdentity || metadataIdentity.userId !== input.authenticatedUserId) {
        logger.warn("Deposit reconcile metadata ownership mismatch", {
          service: "DepositReconcileService",
          paymentIntentId,
          authenticatedUserId: input.authenticatedUserId
        });
        throw appError("NOT_FOUND", "Deposit payment not found");
      }
    } else {
      const metadataIdentity = await depositRepository.resolveIdentity(metadataCreatorId);
      if (!metadataIdentity || metadataIdentity.userId !== account.userId) {
        throw appError("VALIDATION_ERROR", "Deposit metadata ownership mismatch");
      }
    }

    if (payment.id !== paymentId) {
      throw appError("VALIDATION_ERROR", "Deposit payment id mismatch");
    }

    const amountMinor = readIntentMinor(input.intent);
    const currency = readIntentCurrency(input.intent);

    if (payment.amountMinor !== amountMinor) {
      throw appError("VALIDATION_ERROR", "Deposit amount mismatch");
    }
    if (payment.currency.toUpperCase() !== currency) {
      throw appError("VALIDATION_ERROR", "Deposit currency mismatch");
    }

    const metadataMinor = Number(input.intent.metadata?.amount_minor ?? "0");
    const metadataCurrency = String(input.intent.metadata?.currency ?? CREATOR_DEPOSIT_CURRENCY).toUpperCase();
    if (metadataMinor > 0 && metadataMinor !== amountMinor) {
      throw appError("VALIDATION_ERROR", "Deposit metadata amount mismatch");
    }
    if (metadataCurrency !== currency) {
      throw appError("VALIDATION_ERROR", "Deposit metadata currency mismatch");
    }

    return { payment, account, amountMinor, currency };
  }

  async reconcilePaymentIntent(input: ReconcileInput) {
    if (input.intent.metadata?.type !== "creator_deposit") {
      throw appError("VALIDATION_ERROR", "Not a creator deposit payment");
    }

    if (input.intent.status !== "succeeded") {
      return {
        paid: false as const,
        status: input.intent.status
      };
    }

    const { payment, account, amountMinor, currency } = await this.assertOwnership(input);

    const result = await depositRepository.confirmPayment({
      accountId: account.id,
      paymentId: payment.id,
      amountMinor,
      currency,
      stripeSessionId: input.stripeSessionId,
      stripePaymentIntentId: input.intent.id
    });

    if (!result.duplicate) {
      const legacyKey = account.legacyCreatorId ?? account.creatorProfileId;
      const { ensureCertificationFormAndMessage } = await import(
        "@/lib/studioos/certification-form-notify"
      );
      await ensureCertificationFormAndMessage({
        creatorId: legacyKey,
        depositPaymentId: result.payment.id
      }).catch(() => undefined);
    }

    return {
      paid: true as const,
      status: input.intent.status,
      duplicate: result.duplicate,
      paymentId: result.payment.id,
      creatorId: account.legacyCreatorId ?? account.creatorProfileId,
      amountUsd: depositAmountUsdFromMinor(amountMinor)
    };
  }

  async reconcileFromCheckoutSession(session: Stripe.Checkout.Session) {
    if (session.metadata?.type !== "creator_deposit") {
      return { handled: false as const };
    }
    if (session.payment_status !== "paid") {
      throw new Error(`Stripe checkout session is not paid: ${session.payment_status}`);
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) {
      throw new Error("Missing payment intent on checkout session");
    }

    const { getStripe } = await import("@/lib/stripe");
    const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    const reconciled = await this.reconcilePaymentIntent({
      intent,
      stripeSessionId: session.id
    });

    return { handled: true as const, ...reconciled };
  }
}

export const depositReconcileService = new DepositReconcileService();
