/** Client-safe Stripe publishable key (Payment Element / embedded checkout). */
export function getStripePublishableKey(): string | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return key || null;
}

export function isStripeEmbeddedReady(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && getStripePublishableKey());
}
