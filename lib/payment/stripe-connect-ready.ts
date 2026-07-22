import { isStripeProductionReady } from "@/lib/payment/stripe-ready";

export function isStripeConnectConfigured() {
  return isStripeProductionReady();
}

export function defaultConnectCountry() {
  return (process.env.STRIPE_CONNECT_COUNTRY ?? "HK").trim().toUpperCase();
}
