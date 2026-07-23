import type Stripe from "stripe";
import { escrowService } from "@/features/payment/escrow.service";
import { escrowRepository } from "@/features/payment/escrow.repository";
import { paymentCollectionService } from "@/features/payment/payment-collection.service";
import { getOrder, markOrderPaid } from "@/lib/order-service";
import { logger } from "@/lib/core/logger";

export class PaymentWebhookService {
  async handleStripeEvent(event: Stripe.Event) {
    const reservation = await escrowRepository.reserveWebhook({
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      payload: event as unknown as Record<string, unknown>
    });
    if (reservation.duplicate) {
      return { received: true, duplicate: true };
    }

    let processed = false;
    let result: Record<string, unknown> = {};

    try {
      switch (event.type) {
        case "checkout.session.completed":
          result = await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          processed = true;
          break;
        case "checkout.session.async_payment_succeeded":
          result = await this.handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session);
          processed = true;
          break;
        case "checkout.session.expired":
          result = await this.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
          processed = true;
          break;
        case "checkout.session.async_payment_failed":
          result = await this.handleCheckoutFailed(event.data.object as Stripe.Checkout.Session);
          processed = true;
          break;
        case "payment_intent.payment_failed":
          result = await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          processed = true;
          break;
        case "payment_intent.succeeded":
          result = await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          processed = true;
          break;
        case "charge.refunded":
          result = await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          processed = true;
          break;
        case "charge.dispute.created":
          result = await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
          processed = true;
          break;
        case "charge.dispute.closed":
          result = await this.handleDisputeClosed(event.data.object as Stripe.Dispute);
          processed = true;
          break;
        case "account.updated":
          result = await this.handleAccountUpdated(event.data.object as Stripe.Account);
          processed = true;
          break;
        case "transfer.created":
        case "transfer.reversed":
          result = await this.handleTransferEvent(event.type, event.data.object as Stripe.Transfer);
          processed = true;
          break;
        case "payout.paid":
        case "payout.failed":
          result = await this.handlePayoutEvent(event.type, event.data.object as Stripe.Payout);
          processed = true;
          break;
        default:
          result = { ignored: true, type: event.type };
      }

      await escrowRepository.markWebhookProcessed(reservation.id, {
        eventType: event.type,
        payload: event as unknown as Record<string, unknown>,
        processed
      });

      return { received: true, duplicate: false, ...result };
    } catch (error) {
      await escrowRepository.markWebhookProcessed(reservation.id, {
        eventType: `${event.type}:failed`,
        payload: { ...(event as unknown as Record<string, unknown>), error: String(error) },
        processed: false
      });
      throw error;
    }
  }

  private async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    if (session.metadata?.type === "credit_package_purchase") {
      const { creditPurchaseService } = await import("@/features/credit-wallet/credit-purchase.service");
      return creditPurchaseService.handleStripeCheckoutCancelled(session);
    }

    const campaignId = session.metadata?.campaign_id;
    return paymentCollectionService.handlePaymentFailed({
      campaignId: campaignId ?? undefined,
      stripeSessionId: session.id,
      reason: "CANCELLED"
    });
  }

  private async handleCheckoutFailed(session: Stripe.Checkout.Session) {
    if (session.metadata?.type === "credit_package_purchase") {
      const { creditPurchaseService } = await import("@/features/credit-wallet/credit-purchase.service");
      return creditPurchaseService.handleStripeCheckoutFailed(session);
    }

    const campaignId = session.metadata?.campaign_id;
    return paymentCollectionService.handlePaymentFailed({
      campaignId: campaignId ?? undefined,
      stripeSessionId: session.id,
      reason: "FAILED"
    });
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const campaignId = paymentIntent.metadata?.campaign_id;
    return paymentCollectionService.handlePaymentFailed({
      campaignId: campaignId ?? undefined,
      reason: "FAILED"
    });
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const { stripePaymentFulfillmentService } = await import(
      "@/features/payment/stripe-payment-fulfillment.service"
    );
    const creatorDeposit =
      await stripePaymentFulfillmentService.fulfillCreatorDepositFromPaymentIntent(paymentIntent);
    if (creatorDeposit.handled) {
      return creatorDeposit;
    }
    return { ignored: true, type: paymentIntent.metadata?.type ?? "unknown" };
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    const { creditPurchaseService } = await import("@/features/credit-wallet/credit-purchase.service");
    const refund = charge.refunds?.data?.[0];
    const result = await creditPurchaseService.handleStripeRefund({
      charge,
      refundId: refund?.id ?? `${charge.id}:${charge.amount_refunded}`
    });
    if (result.handled) {
      logger.info("Credit purchase refunded via Stripe", {
        service: "PaymentWebhookService",
        orderId: result.orderId,
        duplicate: result.duplicate,
        clawedBack: result.clawedBack,
        shortfall: result.shortfall,
        cumulativeRefundedMinor: result.cumulativeRefundedMinor
      });
    }
    return result;
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    const { creditPurchaseService } = await import("@/features/credit-wallet/credit-purchase.service");
    const result = await creditPurchaseService.handleStripeDisputeCreated(dispute);
    if (result.handled) {
      logger.warn("Credit purchase dispute opened", {
        service: "PaymentWebhookService",
        orderId: result.orderId,
        duplicate: result.duplicate,
        heldCredits: result.heldCredits
      });
    }
    return result;
  }

  private async handleDisputeClosed(dispute: Stripe.Dispute) {
    const { creditPurchaseService } = await import("@/features/credit-wallet/credit-purchase.service");
    const result = await creditPurchaseService.handleStripeDisputeClosed(dispute);
    if (result.handled) {
      logger.info("Credit purchase dispute closed", {
        service: "PaymentWebhookService",
        orderId: result.orderId,
        duplicate: result.duplicate,
        merchantWon: result.merchantWon,
        releasedCredits: result.releasedCredits,
        forfeitedCredits: result.forfeitedCredits
      });
    }
    return result;
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    const { stripeConnectService } = await import("@/features/payment/stripe-connect.service");
    return stripeConnectService.syncAccountFromWebhook(account);
  }

  private async handleTransferEvent(type: string, transfer: Stripe.Transfer) {
    logger.info("Stripe Connect transfer event", {
      service: "PaymentWebhookService",
      type,
      transferId: transfer.id,
      destination: transfer.destination,
      amount: transfer.amount,
      withdrawId: transfer.metadata?.vincis_withdraw_id ?? null
    });
    return {
      handled: true,
      type,
      transferId: transfer.id,
      withdrawId: transfer.metadata?.vincis_withdraw_id ?? null
    };
  }

  private async handlePayoutEvent(type: string, payout: Stripe.Payout) {
    logger.info("Stripe Connect payout event", {
      service: "PaymentWebhookService",
      type,
      payoutId: payout.id,
      amount: payout.amount,
      status: payout.status
    });
    return { handled: true, type, payoutId: payout.id, status: payout.status };
  }

  private async handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
    if (session.metadata?.type !== "credit_package_purchase") {
      return { ignored: true, reason: "not_credit_purchase" };
    }

    const { creditPurchaseService } = await import("@/features/credit-wallet/credit-purchase.service");
    const result = await creditPurchaseService.handleStripeCheckoutPaid({ session });

    logger.info("Credit package credited via async Stripe payment", {
      service: "PaymentWebhookService",
      userId: session.metadata.user_id,
      orderId: session.metadata.order_id,
      duplicate: result.duplicate,
      sessionId: session.id
    });

    return {
      orderId: session.metadata.order_id,
      credited: !result.duplicate,
      totalCredits: result.totalCredits ?? null,
      asyncPayment: true
    };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.metadata?.type === "credit_package_purchase") {
      const { creditPurchaseService } = await import("@/features/credit-wallet/credit-purchase.service");
      const result = await creditPurchaseService.handleStripeCheckoutCompleted(session);

      if ("deferred" in result && result.deferred) {
        logger.info("Credit purchase checkout completed with deferred payment", {
          service: "PaymentWebhookService",
          userId: session.metadata.user_id,
          orderId: session.metadata.order_id,
          paymentStatus: result.paymentStatus,
          sessionId: session.id
        });
        return {
          orderId: result.orderId,
          deferred: true,
          paymentStatus: result.paymentStatus
        };
      }

      if (!("duplicate" in result)) {
        return { ignored: true, reason: "credit_checkout_not_handled" };
      }

      logger.info("Credit package credited via Stripe", {
        service: "PaymentWebhookService",
        userId: session.metadata.user_id,
        orderId: session.metadata.order_id,
        duplicate: result.duplicate,
        sessionId: session.id
      });

      return {
        orderId: session.metadata.order_id,
        credited: !result.duplicate,
        totalCredits: result.totalCredits ?? null
      };
    }

    const { stripePaymentFulfillmentService } = await import(
      "@/features/payment/stripe-payment-fulfillment.service"
    );

    const walletRecharge = await stripePaymentFulfillmentService.fulfillBrandWalletRecharge(session);
    if (walletRecharge.handled) return walletRecharge;

    const creatorDeposit = await stripePaymentFulfillmentService.fulfillCreatorDeposit(session);
    if (creatorDeposit.handled) return creatorDeposit;

    const paidRevision = await stripePaymentFulfillmentService.fulfillPaidRevisionAddon(session);
    if (paidRevision.handled) return paidRevision;

    const campaignId = session.metadata?.campaign_id;
    const orderId = session.metadata?.order_id;
    if (session.payment_status !== "paid") {
      throw new Error(`Stripe checkout session is not paid: ${session.payment_status}`);
    }

    if (campaignId) {
      const escrow = await escrowRepository.findByCampaignId(campaignId);
      if (!escrow) {
        throw new Error("Escrow payment not found for Stripe checkout session");
      }
      const expectedAmount = Math.round(Number(escrow.amount) * 100);
      const paidAmount = session.amount_total ?? 0;
      const expectedCurrency = escrow.currency.toLowerCase();
      const paidCurrency = (session.currency ?? "").toLowerCase();
      if (paidAmount !== expectedAmount || paidCurrency !== expectedCurrency) {
        throw new Error("Stripe checkout amount or currency mismatch");
      }

      const paymentResult = await escrowService.completePayment({
        campaignId,
        stripePaymentId: session.payment_intent?.toString() ?? session.id,
        stripeSessionId: session.id
      });

      logger.info("Escrow funded via Stripe", {
        service: "PaymentWebhookService",
        campaignId,
        sessionId: session.id
      });

      return { campaignId, paymentResult };
    }

    if (orderId) {
      const existingOrder = await getOrder(orderId);
      if (!existingOrder) {
        throw new Error("Legacy order not found for Stripe checkout session");
      }
      const expectedAmount = Math.round(existingOrder.amount * 100);
      const paidAmount = session.amount_total ?? 0;
      const paidCurrency = (session.currency ?? "usd").toLowerCase();
      if (paidAmount !== expectedAmount || paidCurrency !== "usd") {
        throw new Error("Stripe checkout amount or currency mismatch");
      }

      const order = await markOrderPaid(orderId);
      if (order) {
        const { syncBrandOrderPaid } = await import("@/lib/studioos/brand-checkout-service");
        await syncBrandOrderPaid(order);
      }
      return { orderId, legacy: true };
    }

    if (session.metadata?.type === "creator_membership_upgrade") {
      const creatorId = session.metadata.creator_id;
      const planId = session.metadata.plan_id;
      if (!creatorId || !planId) {
        return { ignored: true, reason: "missing_membership_metadata" };
      }

      const { membershipStripeService } = await import(
        "@/features/membership/membership-expiration.service"
      );
      const amountPaid = (session.amount_total ?? 0) / 100;
      const membership = await membershipStripeService.activateFromStripePayment({
        creatorId,
        planId,
        paymentId: session.payment_intent?.toString() ?? session.id,
        stripeSessionId: session.id,
        amountPaid,
        currency: (session.currency ?? "usd").toUpperCase()
      });

      logger.info("Creator membership activated via Stripe", {
        service: "PaymentWebhookService",
        creatorId,
        membershipId: membership.id,
        sessionId: session.id
      });

      return { membershipId: membership.id, creatorId };
    }

    return { ignored: true };
  }
}

export const paymentWebhookService = new PaymentWebhookService();
