import Stripe from "stripe";
import { getAppBaseUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe";

export class StripeCheckoutService {
  isConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  }

  async createCampaignCheckout(input: {
    campaignId: string;
    escrowId: string;
    amount: number;
    currency: string;
    title: string;
    brandEmail?: string;
    portalProjectId?: string;
  }): Promise<Stripe.Checkout.Session> {
    if (!this.isConfigured()) {
      throw new Error("Stripe is not configured");
    }

    const stripe = getStripe();
    const appUrl = getAppBaseUrl();
    const portalProjectId = input.portalProjectId ?? input.campaignId;

    return stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.brandEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency,
            unit_amount: Math.round(input.amount * 100),
            product_data: {
              name: input.title,
              description: "Full escrow payment — funds held until delivery approval"
            }
          }
        }
      ],
      metadata: {
        campaign_id: input.campaignId,
        escrow_id: input.escrowId
      },
      success_url: `${appUrl}/brand/projects/${portalProjectId}?tab=match`,
      cancel_url: `${appUrl}/brand/projects/${portalProjectId}/checkout?pay=cancelled`
    });
  }
}

export const stripeCheckoutService = new StripeCheckoutService();
