import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

type StripePlatformConnectContext = {
  country: string;
  currency: string;
};

let cachedPlatformContext: StripePlatformConnectContext | null = null;

export async function getStripePlatformConnectContext(
  stripe: Stripe = getStripe()
): Promise<StripePlatformConnectContext> {
  if (cachedPlatformContext) {
    return cachedPlatformContext;
  }

  const platform = await stripe.accounts.retrieve();
  cachedPlatformContext = {
    country: (platform.country ?? "HK").toUpperCase(),
    currency: (platform.default_currency ?? "hkd").toLowerCase()
  };
  return cachedPlatformContext;
}

export function usdToSettlementMinor(amountUsd: number, settlementCurrency: string) {
  const normalized = settlementCurrency.toLowerCase();
  if (normalized === "usd") {
    return Math.round(amountUsd * 100);
  }
  if (normalized === "hkd") {
    const rate = Number(process.env.STRIPE_CONNECT_USD_HKD_RATE ?? "7.8");
    return Math.round(amountUsd * rate * 100);
  }
  throw new Error(`Unsupported Stripe Connect settlement currency: ${settlementCurrency}`);
}

export function settlementCurrencyLabel(settlementCurrency: string) {
  return settlementCurrency.toUpperCase();
}

/** Test-mode helper: ensure the platform has enough available balance for Connect transfers. */
export async function ensurePlatformTransferBalance(
  requiredMinor: number,
  settlementCurrency: string,
  stripe: Stripe = getStripe()
) {
  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
    throw new Error("Refusing to seed Stripe platform balance in live mode");
  }

  const balance = await stripe.balance.retrieve();
  const available =
    balance.available.find((entry) => entry.currency === settlementCurrency)?.amount ?? 0;
  if (available >= requiredMinor) {
    return { seeded: false as const, availableMinor: available };
  }

  const topUpMinor = requiredMinor - available + 10_000;
  await stripe.paymentIntents.create({
    amount: topUpMinor,
    currency: settlementCurrency,
    payment_method: "pm_card_bypassPending",
    confirm: true,
    payment_method_types: ["card"],
    description: "Stripe Connect verify platform balance seed"
  });

  return { seeded: true as const, topUpMinor, availableMinor: available };
}
