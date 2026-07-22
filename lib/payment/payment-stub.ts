/**
 * Temporary global payment stub — click pay → immediate success, no external provider.
 * Set VINCIS_PAYMENT_STUB=0 after real payment APIs are integrated.
 */
export function isPaymentStubMode(): boolean {
  return process.env.VINCIS_PAYMENT_STUB !== "0";
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
