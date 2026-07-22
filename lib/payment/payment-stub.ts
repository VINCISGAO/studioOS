/**
 * Payment stub gate — demo checkout when Stripe is not fully configured.
 * Set VINCIS_PAYMENT_STUB=1 to force stub; VINCIS_PAYMENT_STUB=0 to force live Stripe.
 * When STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET are set, live Stripe is used by default.
 */
import { isStripeProductionReady } from "@/lib/payment/stripe-ready";

export function isPaymentStubMode(): boolean {
  if (process.env.VINCIS_PAYMENT_STUB === "0") return false;
  if (process.env.VINCIS_PAYMENT_STUB === "1") return true;
  return !isStripeProductionReady();
}

/** Skip Stripe / Alipay checkout redirects and complete payment in-app. */
export function shouldBypassExternalCheckout(): boolean {
  return isPaymentStubMode();
}

/** Allow demo / synthetic payment completion (including in production while stub is on). */
export function allowDemoPaymentFallback(): boolean {
  if (isPaymentStubMode()) {
    return true;
  }
  if (
    process.env.VINCIS_ENABLE_DEMO_PAYMENT === "1" ||
    process.env.STUDIOOS_ENABLE_DEMO_PAYMENT === "1"
  ) {
    return true;
  }
  return process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";
}
