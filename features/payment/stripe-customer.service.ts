import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { isStripeEmbeddedReady } from "@/lib/payment/stripe-publishable";

export class StripeCustomerService {
  isEnabled() {
    return isStripeEmbeddedReady();
  }

  async getOrCreateForUser(input: {
    userId: string;
    email: string;
    fullName: string;
  }): Promise<Stripe.Customer> {
    if (!this.isEnabled()) {
      throw new Error("Stripe embedded payments are not configured");
    }

    const stripe = getStripe();
    const existing = await stripe.customers.list({
      email: input.email.toLowerCase(),
      limit: 5
    });

    const matched =
      existing.data.find((customer) => customer.metadata?.vincis_user_id === input.userId) ??
      existing.data[0];
    if (matched) {
      if (matched.metadata?.vincis_user_id !== input.userId) {
        return stripe.customers.update(matched.id, {
          metadata: { ...matched.metadata, vincis_user_id: input.userId }
        });
      }
      return matched;
    }

    return stripe.customers.create({
      email: input.email.toLowerCase(),
      name: input.fullName,
      metadata: { vincis_user_id: input.userId }
    });
  }
}

export const stripeCustomerService = new StripeCustomerService();
