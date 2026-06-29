import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { paymentWebhookService } from "@/features/payment/payment-webhook.service";
import { getStripe } from "@/lib/stripe";

/** Legacy Stripe webhook — delegates to v1 payment webhook service. */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe webhook configuration" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const result = await paymentWebhookService.handleStripeEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
