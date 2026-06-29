import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { addSystemMessage } from "@/lib/chat-service";
import { getOrder, markOrderPaid } from "@/lib/order-service";
import { getStripe } from "@/lib/stripe";

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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        const order = await markOrderPaid(orderId);
        if (order) {
          await addSystemMessage(
            order.inquiry_id,
            `Escrow payment completed via Stripe. Order ${order.id} is now in production.`
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
