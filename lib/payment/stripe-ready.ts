/** Stripe is configured enough for live Checkout + webhooks. */
export function isStripeProductionReady(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim()
  );
}
