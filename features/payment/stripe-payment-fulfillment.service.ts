import type Stripe from "stripe";
import { walletRepository } from "@/features/wallet/wallet.repository";
import { confirmCreatorDepositFromStripe } from "@/lib/studioos/deposit-service";
import { CREATOR_DEPOSIT_USD } from "@/lib/studioos/deposit-copy";
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
    if (!expectedMinor || amountMinor !== expectedMinor) {
      throw new Error("Stripe wallet recharge amount mismatch");
    }
    if (expectedCurrency !== currency) {
      throw new Error("Stripe wallet recharge currency mismatch");
    }

    const wallet = await walletRepository.getOrCreate(userId);
    const amount = amountMinor / 100;
    const result = await walletRepository.creditBrandWalletRechargeOnce({
      walletId: wallet.id,
      sessionId: session.id,
      amount
    });

    logger.info("Brand wallet recharged via Stripe", {
      service: "StripePaymentFulfillmentService",
      userId,
      sessionId: session.id,
      amount,
      duplicate: result.duplicate
    });

    return { handled: true as const, userId, amount, sessionId: session.id, duplicate: result.duplicate };
  }

  async fulfillCreatorDeposit(session: Stripe.Checkout.Session) {
    if (session.metadata?.type !== "creator_deposit") {
      return { handled: false as const };
    }
    assertPaidSession(session);
    const creatorId = session.metadata.creator_id;
    const paymentId = session.metadata.payment_id;
    if (!creatorId || !paymentId) {
      throw new Error("Missing creator deposit metadata");
    }

    const { amountMinor } = readMinor(session);
    const expectedMinor = Number(session.metadata.amount_minor ?? "0");
    const expectedDepositMinor = Math.round(CREATOR_DEPOSIT_USD * 100);
    if (!expectedMinor || amountMinor !== expectedMinor || amountMinor !== expectedDepositMinor) {
      throw new Error("Creator deposit amount mismatch");
    }

    const result = await confirmCreatorDepositFromStripe({
      creatorId,
      paymentId,
      stripeSessionId: session.id,
      amountUsd: amountMinor / 100
    });

    logger.info("Creator deposit confirmed via Stripe", {
      service: "StripePaymentFulfillmentService",
      creatorId,
      paymentId,
      sessionId: session.id,
      duplicate: result.duplicate
    });

    return { handled: true as const, ...result };
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
