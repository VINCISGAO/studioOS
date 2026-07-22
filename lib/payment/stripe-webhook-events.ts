/**
 * Stripe webhook events handled by `PaymentWebhookService` (`/api/v1/webhooks/stripe`).
 * Keep this list in sync with `features/payment/payment-webhook.service.ts`.
 */
export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
  "checkout.session.async_payment_failed",
  "payment_intent.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
  "account.updated",
  "transfer.created",
  "transfer.reversed",
  "payout.paid",
  "payout.failed"
] as const;

export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number];

export const STRIPE_WEBHOOK_ROUTE_PATH = "/api/v1/webhooks/stripe";

export function stripeWebhookUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}${STRIPE_WEBHOOK_ROUTE_PATH}`;
}
