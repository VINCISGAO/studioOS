import type Stripe from "stripe";
import { creditAuditService } from "@/features/credit-wallet/credit-audit.service";
import { creditPackageRegionalPricingService } from "@/features/credit-wallet/credit-package-regional-pricing.service";
import { creditWalletRepository } from "@/features/credit-wallet/credit-wallet.repository";
import { stripeCheckoutService } from "@/features/payment/stripe-checkout.service";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { getAppBaseUrl } from "@/lib/app-url";
import { stripeUnitAmount, formatAmountMinor } from "@/lib/credits/currency-minor-units";
import { normalizeRegionCode } from "@/lib/credits/regional-package.constants";
import type { Locale } from "@/lib/i18n";
import { getStripe } from "@/lib/stripe";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";
import { logger } from "@/lib/core/logger";
import {
  allowDemoPaymentFallback,
  shouldBypassExternalCheckout
} from "@/lib/payment/payment-stub";

function resolveChargeId(session: Stripe.Checkout.Session): string | undefined {
  if (typeof session.payment_intent === "object" && session.payment_intent?.latest_charge) {
    return typeof session.payment_intent.latest_charge === "string"
      ? session.payment_intent.latest_charge
      : session.payment_intent.latest_charge.id;
  }
  return undefined;
}

export class CreditPurchaseService {
  private assertDb() {
    if (!hasDatabaseUrl()) throw appError("SYSTEM_ERROR", "DATABASE_URL not configured");
  }

  private async auditPurchase(
    action: string,
    userId: string,
    metadata: Record<string, unknown>
  ) {
    const campaignId = await creditAuditService.resolveCampaignId({ userId });
    await creditAuditService.write(action, { userId, campaignId, credits: metadata.totalCredits as number | undefined }, metadata);
  }

  async previewCheckout(
    user: AuthUserDto,
    input: { packageId?: string; customCredits?: number; selectedRegion?: string | null },
    request?: Request,
    uiLocale?: Locale | null
  ) {
    this.assertDb();
    const quote =
      input.customCredits != null
        ? await creditPackageRegionalPricingService.quoteCustomCreditsForUser({
            user,
            customCredits: input.customCredits,
            request,
            selectedRegion: input.selectedRegion,
            uiLocale
          })
        : await creditPackageRegionalPricingService.quoteForUser({
            user,
            packageId: input.packageId!,
            request,
            selectedRegion: input.selectedRegion,
            uiLocale
          });
    return {
      regionCode: quote.regionCode,
      matchedRegion: quote.matchedRegion,
      regionSource: quote.regionSource,
      pricingSource: quote.pricingSource,
      currency: quote.currency,
      amountMinor: quote.amountMinor,
      displayAmount: quote.displayAmount,
      baseCredits: quote.baseCredits,
      bonusCredits: quote.bonusCredits,
      totalCredits: quote.totalCredits,
      globalFallbackUsed: quote.globalFallbackUsed,
      packageVersion: quote.packageVersion,
      regionalPriceId: quote.regionalPriceId,
      stripePriceId: quote.stripePriceId,
      quotedAt: quote.quotedAt,
      purchaseKind: input.customCredits != null ? ("custom" as const) : ("package" as const),
      referencePackageId:
        input.customCredits != null && "referencePackageId" in quote
          ? quote.referencePackageId
          : null
    };
  }

  async createCheckout(
    user: AuthUserDto,
    input: {
      packageId?: string;
      customCredits?: number;
      idempotencyKey: string;
      selectedRegion?: string | null;
    },
    request?: Request,
    uiLocale?: Locale | null
  ) {
    this.assertDb();
    const useDemoPayment =
      shouldBypassExternalCheckout() || !stripeCheckoutService.isConfigured();
    if (useDemoPayment && !allowDemoPaymentFallback()) {
      throw appError("SYSTEM_ERROR", "Stripe checkout is not configured");
    }

    const wallet = await creditWalletRepository.getOrCreateWallet(user.id);
    if (wallet.purchaseBlocked) {
      throw appError("VALIDATION_ERROR", "Credit purchases are temporarily blocked for this account");
    }

    const quoteView = await this.previewCheckout(user, input, request, uiLocale);
    const isCustomPurchase = input.customCredits != null;
    const resolved = isCustomPurchase
      ? null
      : await creditPackageRegionalPricingService.resolvePackageQuote({
          packageId: input.packageId!,
          requestedRegion: normalizeRegionCode(input.selectedRegion ?? quoteView.regionCode)
        });

    const pricingSnapshot = asInputJson({
      purchaseKind: isCustomPurchase ? "custom" : "package",
      packageId: isCustomPurchase ? null : resolved!.package.id,
      packageVersion: isCustomPurchase ? null : resolved!.package.version,
      regionalPriceId: isCustomPurchase ? null : resolved!.regionalPrice.id,
      regionalPriceVersion: isCustomPurchase ? null : resolved!.regionalPrice.version,
      referencePackageId: isCustomPurchase ? quoteView.referencePackageId ?? null : null,
      customCredits: isCustomPurchase ? quoteView.baseCredits : null,
      regionCode: quoteView.regionCode,
      matchedRegion: isCustomPurchase ? quoteView.matchedRegion : resolved!.matchedRegion,
      pricingSource: isCustomPurchase ? quoteView.pricingSource : resolved!.pricingSource,
      currency: quoteView.currency,
      amountMinor: quoteView.amountMinor,
      baseCredits: quoteView.baseCredits,
      bonusCredits: quoteView.bonusCredits,
      totalCredits: quoteView.totalCredits,
      stripePriceId: isCustomPurchase ? null : resolved!.stripePriceId,
      quotedAt: quoteView.quotedAt
    });

    const existing = await creditWalletRepository.findPurchaseOrderByIdempotency(input.idempotencyKey);
    if (existing && existing.userId !== user.id) {
      throw appError("VALIDATION_ERROR", "Idempotency key already in use");
    }
    if (existing?.status === "CREDITED") {
      throw appError("VALIDATION_ERROR", "This purchase was already completed");
    }
    if (existing?.providerSessionId && !useDemoPayment) {
      const session = await stripeCheckoutService.retrieveCheckout(existing.providerSessionId);
      if (session.url && session.status !== "expired") {
        return {
          orderId: existing.id,
          checkoutUrl: session.url,
          mode: "stripe" as const,
          reused: true,
          confirmation: quoteView
        };
      }
    }

    const order =
      existing ??
      (await creditWalletRepository.createPurchaseOrder({
        userId: user.id,
        walletId: wallet.id,
        packageId: isCustomPurchase ? null : resolved!.package.id,
        packageVersion: isCustomPurchase ? null : resolved!.package.version,
        regionalPriceId: isCustomPurchase ? null : resolved!.regionalPrice.id,
        regionCode: quoteView.regionCode,
        credits: quoteView.baseCredits,
        bonusCredits: quoteView.bonusCredits,
        currency: quoteView.currency,
        amountMinor: quoteView.amountMinor,
        stripePriceIdSnapshot: isCustomPurchase ? null : resolved!.stripePriceId,
        pricingSnapshot,
        idempotencyKey: input.idempotencyKey
      }));

    if (
      order.credits !== quoteView.baseCredits ||
      order.bonusCredits !== quoteView.bonusCredits ||
      order.amountMinor !== quoteView.amountMinor ||
      order.currency !== quoteView.currency
    ) {
      throw appError("VALIDATION_ERROR", "Purchase order package snapshot mismatch");
    }

    if (useDemoPayment) {
      return this.completeDemoCheckout(user, order, quoteView, Boolean(existing));
    }

    const appUrl = getAppBaseUrl();
    const stripe = getStripe();
    const checkoutCurrency = quoteView.currency;
    const checkoutAmountMinor = quoteView.amountMinor;
    const unitAmount = stripeUnitAmount(checkoutCurrency, checkoutAmountMinor);
    const productName = isCustomPurchase
      ? `${quoteView.totalCredits.toLocaleString()} VINCIS Token`
      : `${resolved!.package.name} — ${quoteView.totalCredits} VINCIS Credits`;
    const productDescription = isCustomPurchase
      ? `Custom purchase · ${formatAmountMinor(checkoutCurrency, checkoutAmountMinor)}`
      : `Region ${quoteView.regionCode} · ${formatAmountMinor(checkoutCurrency, checkoutAmountMinor)}`;
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem =
      !isCustomPurchase && resolved!.stripePriceId
        ? { quantity: 1, price: resolved!.stripePriceId }
        : {
            quantity: 1,
            price_data: {
              currency: checkoutCurrency.toLowerCase(),
              unit_amount: unitAmount,
              product_data: {
                name: productName,
                description: productDescription
              }
            }
          };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: order.id,
      line_items: [lineItem],
      metadata: {
        type: "credit_package_purchase",
        user_id: user.id,
        order_id: order.id,
        package_id: isCustomPurchase ? "" : resolved!.package.id,
        custom_credits: isCustomPurchase ? String(quoteView.baseCredits) : "",
        idempotency_key: input.idempotencyKey
      },
      success_url: `${appUrl}/studio/credits?checkout=success&order_id=${order.id}`,
      cancel_url: `${appUrl}/studio/credits?checkout=cancelled&order_id=${order.id}`
    });

    if (!session.url) {
      throw appError("SYSTEM_ERROR", "Stripe checkout URL missing");
    }

    const updated = await creditWalletRepository.markPurchasePaymentCreated(order.id, session.id);
    if (updated.count !== 1) {
      logger.error("credit.purchase.checkout_status_update_failed", {
        service: "CreditPurchaseService",
        orderId: order.id,
        sessionId: session.id
      });
    }

    return {
      orderId: order.id,
      checkoutUrl: session.url,
      mode: "stripe" as const,
      reused: false,
      confirmation: quoteView
    };
  }

  private async completeDemoCheckout(
    user: AuthUserDto,
    order: Awaited<ReturnType<typeof creditWalletRepository.createPurchaseOrder>>,
    quoteView: Awaited<ReturnType<typeof this.previewCheckout>>,
    reused: boolean
  ) {
    const appUrl = getAppBaseUrl();
    const demoSessionId = `demo_session_${order.id}`;
    const demoPaymentId = `demo_payment_${order.id}_${Date.now()}`;

    await creditWalletRepository.markPurchasePaymentCreated(order.id, demoSessionId);

    const result = await creditWalletRepository.creditPurchaseOrderOnce({
      orderId: order.id,
      providerPaymentId: demoPaymentId,
      providerSessionId: demoSessionId,
      paidAt: new Date()
    });

    if (!result.duplicate) {
      await this.auditPurchase("credits.purchase_credited", user.id, {
        orderId: order.id,
        sessionId: demoSessionId,
        paymentId: demoPaymentId,
        totalCredits: result.totalCredits,
        packageId: order.packageId,
        demo: true
      });
      logger.info("credit.purchase.demo_completed", {
        service: "CreditPurchaseService",
        orderId: order.id,
        userId: user.id,
        totalCredits: result.totalCredits
      });
    }

    return {
      orderId: order.id,
      checkoutUrl: `${appUrl}/studio/credits?checkout=success&order_id=${order.id}`,
      mode: "demo" as const,
      reused,
      credited: !result.duplicate,
      totalCredits: result.totalCredits,
      confirmation: quoteView
    };
  }

  async getOrderForUser(userId: string, orderId: string) {
    this.assertDb();
    const order = await creditWalletRepository.findPurchaseOrderForUser(orderId, userId);
    if (!order) throw appError("NOT_FOUND", "Credit purchase order not found");
    return order;
  }

  async handleStripeCheckoutCompleted(session: Stripe.Checkout.Session): Promise<
    | { handled: false }
    | { handled: true; deferred: true; orderId: string | null; paymentStatus: string | null }
    | { handled: true; order: Awaited<ReturnType<typeof creditWalletRepository.creditPurchaseOrderOnce>>["order"]; duplicate: boolean; totalCredits: number }
  > {
    if (session.metadata?.type !== "credit_package_purchase") {
      return { handled: false };
    }

    if (session.payment_status !== "paid") {
      return {
        handled: true,
        deferred: true,
        orderId: session.metadata.order_id ?? null,
        paymentStatus: session.payment_status
      };
    }

    const paid = await this.handleStripeCheckoutPaid({ session });
    return {
      handled: true,
      order: paid.order,
      duplicate: paid.duplicate,
      totalCredits: paid.totalCredits
    };
  }

  async handleStripeCheckoutPaid(input: {
    session: Stripe.Checkout.Session;
  }) {
    const session = input.session;
    const userId = session.metadata?.user_id;
    const orderId = session.metadata?.order_id;
    const packageId = session.metadata?.package_id;

    if (session.metadata?.type !== "credit_package_purchase" || !userId || !orderId) {
      throw appError("VALIDATION_ERROR", "Missing credit purchase metadata");
    }
    if (session.payment_status !== "paid") {
      throw appError("VALIDATION_ERROR", `Stripe checkout is not paid: ${session.payment_status}`);
    }

    const order = await creditWalletRepository.findPurchaseOrderById(orderId);
    if (!order) throw appError("NOT_FOUND", "Credit purchase order not found");
    if (order.userId !== userId) {
      throw appError("VALIDATION_ERROR", "Credit purchase user mismatch");
    }
    if (packageId && order.packageId && order.packageId !== packageId) {
      throw appError("VALIDATION_ERROR", "Credit purchase package mismatch");
    }
    if (
      session.metadata?.custom_credits &&
      order.credits !== Number(session.metadata.custom_credits)
    ) {
      throw appError("VALIDATION_ERROR", "Credit purchase custom amount mismatch");
    }
    if (order.amountMinor !== (session.amount_total ?? 0)) {
      throw appError("VALIDATION_ERROR", "Credit purchase amount mismatch");
    }
    if (order.currency.toLowerCase() !== (session.currency ?? "usd").toLowerCase()) {
      throw appError("VALIDATION_ERROR", "Credit purchase currency mismatch");
    }
    if (order.providerSessionId && order.providerSessionId !== session.id) {
      throw appError("VALIDATION_ERROR", "Credit purchase session mismatch");
    }

    const paymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? session.id;

    const result = await creditWalletRepository.creditPurchaseOrderOnce({
      orderId: order.id,
      providerPaymentId: paymentId,
      providerSessionId: session.id,
      providerChargeId: resolveChargeId(session),
      paidAt: new Date()
    });

    if (!result.duplicate) {
      await this.auditPurchase("credits.purchase_credited", userId, {
        orderId: order.id,
        sessionId: session.id,
        paymentId,
        totalCredits: result.totalCredits,
        packageId: order.packageId
      });
    }

    return { handled: true, ...result };
  }

  async handleStripeCheckoutCancelled(session: Stripe.Checkout.Session) {
    if (session.metadata?.type !== "credit_package_purchase") {
      return { handled: false };
    }

    const orderId = session.metadata.order_id;
    if (orderId) {
      await creditWalletRepository.markPurchaseCancelled(orderId);
    } else {
      await creditWalletRepository.markPurchaseCancelledBySession(session.id);
    }

    return { handled: true, orderId: orderId ?? null, status: "CANCELLED" };
  }

  async handleStripeCheckoutFailed(session: Stripe.Checkout.Session) {
    if (session.metadata?.type !== "credit_package_purchase") {
      return { handled: false };
    }

    const orderId = session.metadata.order_id;
    if (orderId) {
      await creditWalletRepository.markPurchaseFailed(orderId);
    } else {
      await creditWalletRepository.markPurchaseFailedBySession(session.id);
    }

    return { handled: true, orderId: orderId ?? null, status: "FAILED" };
  }

  async handleStripeRefund(input: {
    charge: Stripe.Charge;
    refundId: string;
  }) {
    const paymentIntentId =
      typeof input.charge.payment_intent === "string"
        ? input.charge.payment_intent
        : input.charge.payment_intent?.id;

    const orderId = input.charge.metadata?.order_id;
    let order =
      (orderId ? await creditWalletRepository.findPurchaseOrderById(orderId) : null) ??
      (input.charge.id
        ? await creditWalletRepository.findPurchaseOrderByChargeId(input.charge.id)
        : null) ??
      (paymentIntentId
        ? await creditWalletRepository.findPurchaseOrderByPaymentId(paymentIntentId)
        : null);

    if (!order) {
      return { handled: false, reason: "credit_order_not_found" };
    }

    const latestRefund = input.charge.refunds?.data?.[0];
    const refundAmountMinor = latestRefund?.amount ?? input.charge.amount_refunded;
    const cumulativeRefundedMinor = input.charge.amount_refunded;

    const result = await creditWalletRepository.refundPurchaseOrderOnce({
      orderId: order.id,
      providerRefundId: input.refundId,
      refundAmountMinor,
      cumulativeRefundedMinor,
      refundedAt: new Date()
    });

    if (!result.duplicate) {
      await this.auditPurchase("credits.purchase_refunded", order.userId, {
        orderId: order.id,
        refundId: input.refundId,
        clawedBack: result.clawedBack,
        shortfall: result.shortfall,
        cumulativeRefundedMinor: result.cumulativeRefundedMinor
      });
    }

    return {
      handled: true,
      orderId: order.id,
      duplicate: result.duplicate,
      clawedBack: result.clawedBack,
      shortfall: result.shortfall,
      cumulativeRefundedMinor: result.cumulativeRefundedMinor
    };
  }

  async handleStripeDisputeCreated(dispute: Stripe.Dispute) {
    const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
    if (!chargeId) {
      return { handled: false, reason: "missing_charge_id" };
    }

    const order = await creditWalletRepository.findPurchaseOrderByChargeId(chargeId);
    if (!order) {
      return { handled: false, reason: "credit_order_not_found" };
    }

    const result = await creditWalletRepository.handlePurchaseDisputeCreated({
      orderId: order.id,
      stripeDisputeId: dispute.id,
      disputeStatus: dispute.status
    });

    if (!result.duplicate) {
      await this.auditPurchase("credits.purchase_disputed", order.userId, {
        orderId: order.id,
        stripeDisputeId: dispute.id,
        disputeStatus: dispute.status,
        heldCredits: result.heldCredits
      });
      logger.warn("credit.purchase.dispute_created", {
        service: "CreditPurchaseService",
        orderId: order.id,
        userId: order.userId,
        stripeDisputeId: dispute.id,
        heldCredits: result.heldCredits
      });
    }

    return {
      handled: true,
      orderId: order.id,
      duplicate: result.duplicate,
      heldCredits: result.heldCredits
    };
  }

  async handleStripeDisputeClosed(dispute: Stripe.Dispute) {
    const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
    if (!chargeId) {
      return { handled: false, reason: "missing_charge_id" };
    }

    const order = await creditWalletRepository.findPurchaseOrderByChargeId(chargeId);
    if (!order) {
      return { handled: false, reason: "credit_order_not_found" };
    }

    const merchantWon = dispute.status === "won";
    const result = await creditWalletRepository.handlePurchaseDisputeClosed({
      orderId: order.id,
      stripeDisputeId: dispute.id,
      disputeStatus: dispute.status,
      merchantWon
    });

    if (!result.duplicate) {
      await this.auditPurchase("credits.purchase_dispute_closed", order.userId, {
        orderId: order.id,
        stripeDisputeId: dispute.id,
        disputeStatus: dispute.status,
        merchantWon,
        releasedCredits: result.releasedCredits,
        forfeitedCredits: result.forfeitedCredits
      });
    }

    return {
      handled: true,
      orderId: order.id,
      duplicate: result.duplicate,
      merchantWon,
      releasedCredits: result.releasedCredits,
      forfeitedCredits: result.forfeitedCredits
    };
  }
}

export const creditPurchaseService = new CreditPurchaseService();
