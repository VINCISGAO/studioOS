import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    amount?: number;
    quoteId?: string;
    projectId?: string;
    creatorName?: string;
    description?: string;
  };
  const appUrl = getAppBaseUrl();
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "A confirmed quote amount is required before Checkout." },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to enable Checkout." },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: body.creatorName ? `VINCIS quote with ${body.creatorName}` : "VINCIS accepted quote",
            description: body.description ?? "Escrow payment for an accepted AI advertising production quote."
          }
        }
      }
    ],
    metadata: {
      project_id: body.projectId ?? "",
      quote_id: body.quoteId ?? ""
    },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/creators?checkout=cancelled`
  });

  return NextResponse.json({ url: session.url });
}
