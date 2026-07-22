import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { stripeUnitAmount } from "@/lib/credits/currency-minor-units";
import { isStripeProductionReady } from "@/lib/payment/stripe-ready";

export const STRIPE_CHECKOUT_TYPES = [
  "credit_package_purchase",
  "campaign_escrow",
  "creator_membership_upgrade",
  "creator_deposit",
  "brand_wallet_recharge",
  "paid_revision_addon"
] as const;

export type StripeCheckoutType = (typeof STRIPE_CHECKOUT_TYPES)[number];

export type CreateStripeCheckoutInput = {
  type: StripeCheckoutType;
  customerEmail?: string | null;
  clientReferenceId?: string | null;
  currency: string;
  amountMinor: number;
  productName: string;
  productDescription?: string;
  stripePriceId?: string | null;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
};

export class StripeUnifiedCheckoutService {
  isConfigured() {
    return isStripeProductionReady();
  }

  async createSession(input: CreateStripeCheckoutInput): Promise<Stripe.Checkout.Session> {
    if (!this.isConfigured()) {
      throw new Error("Stripe is not configured");
    }

    const stripe = getStripe();
    const currency = input.currency.trim().toLowerCase();
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = input.stripePriceId
      ? { quantity: 1, price: input.stripePriceId }
      : {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: stripeUnitAmount(input.currency, input.amountMinor),
            product_data: {
              name: input.productName,
              description: input.productDescription
            }
          }
        };

    return stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.customerEmail ?? undefined,
      client_reference_id: input.clientReferenceId ?? undefined,
      line_items: [lineItem],
      metadata: {
        type: input.type,
        ...input.metadata
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl
    });
  }

  async retrieveSession(sessionId: string) {
    if (!this.isConfigured()) {
      throw new Error("Stripe is not configured");
    }
    return getStripe().checkout.sessions.retrieve(sessionId);
  }
}

export const stripeUnifiedCheckoutService = new StripeUnifiedCheckoutService();
