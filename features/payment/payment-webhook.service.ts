import type Stripe from "stripe";
import { escrowService } from "@/features/payment/escrow.service";
import { escrowRepository } from "@/features/payment/escrow.repository";
import { markOrderPaid } from "@/lib/order-service";
import { logger } from "@/lib/core/logger";

export class PaymentWebhookService {
  async handleStripeEvent(event: Stripe.Event) {
    const already = await escrowRepository.hasProcessedStripeEvent(event.id);
    if (already) {
      return { received: true, duplicate: true };
    }

    let processed = false;
    let result: Record<string, unknown> = {};

    try {
      if (event.type === "checkout.session.completed") {
        result = await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        processed = true;
      }

      await escrowRepository.recordWebhook({
        provider: "stripe",
        eventType: event.type,
        payload: event as unknown as Record<string, unknown>,
        processed
      });

      return { received: true, duplicate: false, ...result };
    } catch (error) {
      await escrowRepository.recordWebhook({
        provider: "stripe",
        eventType: `${event.type}:failed`,
        payload: { ...(event as unknown as Record<string, unknown>), error: String(error) },
        processed: false
      });
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const campaignId = session.metadata?.campaign_id;
    const orderId = session.metadata?.order_id;

    if (campaignId) {
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
