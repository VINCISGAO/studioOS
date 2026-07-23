import type Stripe from "stripe";
import { walletRepository } from "@/features/wallet/wallet.repository";
import { depositReconcileService } from "@/features/deposit/deposit-reconcile.service";
import { paidRevisionService } from "@/features/review/paid-revision.service";
import { logger } from "@/lib/core/logger";

function assertPaidSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") {
    throw new Error(`Stripe checkout session is not paid: ${session.payment_status}`);
  }
}

function readMinor(session: Stripe.Checkout.Session) {
  const amountMinor = session.amount_total ?? 0;
  const currency = (session.currency ?? "usd").toUpperCase();
  return { amountMinor, currency };
}

export class StripePaymentFulfillmentService {
  async fulfillBrandWalletRecharge(session: Stripe.Checkout.Session) {
    if (session.metadata?.type !== "brand_wallet_recharge") {
      return { handled: false as const };
    }
    assertPaidSession(session);
    const userId = session.metadata.user_id;
    if (!userId) throw new Error("Missing brand user id for wallet recharge");

    const { amountMinor, currency } = readMinor(session);
    const expectedMinor = Number(session.metadata.amount_minor ?? "0");
    const expectedCurrency = (session.metadata.currency ?? "USD").toUpperCase();
    if (expectedMinor > 0 && amountMinor !== expectedMinor) {
      throw new Error("Stripe wallet recharge amount mismatch");
    }
    if (expectedCurrency !== currency) {
      throw new Error("Stripe wallet recharge currency mismatch");
    }

    const wallet = await walletRepository.getOrCreate(userId);
    const amount = amountMinor / 100;
    const description = `Stripe wallet recharge (${session.id})`;
    const existing = await walletRepository.findEscrowDepositByDescription(wallet.id, description);
    if (existing) {
      return {
        handled: true as const,
        userId,
        amount: Number(existing.amount),
        sessionId: session.id,
        duplicate: true as const
      };
    }

    const balanceAfter = Number(wallet.availableBalance) + amount;
    await walletRepository.applyLedgerUpdate({
      walletId: wallet.id,
      availableDelta: amount,
      entries: [
        {
          type: "ESCROW_DEPOSIT",
          amount,
          balanceAfter,
          description
        }
      ]
    });

    logger.info("Brand wallet recharged via Stripe", {
      service: "StripePaymentFulfillmentService",
      userId,
      sessionId: session.id,
      amount
    });

    return { handled: true as const, userId, amount, sessionId: session.id, duplicate: false as const };
  }

  async fulfillCreatorDeposit(session: Stripe.Checkout.Session) {
    if (session.metadata?.type !== "creator_deposit") {
      return { handled: false as const };
    }

    const result = await depositReconcileService.reconcileFromCheckoutSession(session);
    if (!result.handled) {
      return { handled: false as const };
    }

    logger.info("Creator deposit confirmed via Stripe", {
      service: "StripePaymentFulfillmentService",
      creatorId: result.creatorId,
      paymentId: result.paymentId,
      sessionId: session.id,
      duplicate: result.duplicate
    });

    return {
      handled: true as const,
      duplicate: result.duplicate,
      paymentId: result.paymentId,
      creatorId: result.creatorId
    };
  }

  async fulfillCreatorDepositFromPaymentIntent(intent: Stripe.PaymentIntent) {
    if (intent.metadata?.type !== "creator_deposit") {
      return { handled: false as const };
    }

    const result = await depositReconcileService.reconcilePaymentIntent({ intent });
    if (!result.paid) {
      throw new Error(`Stripe payment intent is not succeeded: ${intent.status}`);
    }

    logger.info("Creator deposit confirmed via Stripe PaymentIntent", {
      service: "StripePaymentFulfillmentService",
      creatorId: result.creatorId,
      paymentId: result.paymentId,
      paymentIntentId: intent.id,
      duplicate: result.duplicate
    });

    return {
      handled: true as const,
      duplicate: result.duplicate,
      paymentId: result.paymentId,
      creatorId: result.creatorId
    };
  }

  async fulfillPaidRevisionAddon(session: Stripe.Checkout.Session) {
    if (session.metadata?.type !== "paid_revision_addon") {
      return { handled: false as const };
    }
    assertPaidSession(session);

    const orderId = session.metadata.order_id;
    const brandEmail = session.metadata.brand_email;
    const projectId = session.metadata.project_id || null;
    const locale = session.metadata.locale === "zh" ? "zh" : "en";
    if (!orderId || !brandEmail) {
      throw new Error("Missing paid revision metadata");
    }

    const result = await paidRevisionService.completePaidRevisionFromStripe({
      orderId,
      projectId,
      brandEmail,
      locale,
      stripeSessionId: session.id,
      expectedAmountMinor: Number(session.metadata.amount_minor ?? "0")
    });

    logger.info("Paid revision add-on fulfilled via Stripe", {
      service: "StripePaymentFulfillmentService",
      orderId,
      sessionId: session.id,
      duplicate: result.duplicate
    });

    return { handled: true as const, ...result };
  }
}

export const stripePaymentFulfillmentService = new StripePaymentFulfillmentService();
