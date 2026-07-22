import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { getInquiry } from "@/lib/chat-service";
import { getQuote } from "@/lib/order-service";
import { getStripe } from "@/lib/stripe";
import { shouldBypassExternalCheckout } from "@/lib/payment/payment-stub";

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
  const clientEmail = await getCurrentClientEmail();

  if (!clientEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "A confirmed quote amount is required before Checkout." },
      { status: 400 }
    );
  }
  const quoteId = String(body.quoteId ?? "").trim();
  if (!quoteId) {
    return NextResponse.json(
      { error: "A confirmed quote amount is required before Checkout." },
      { status: 400 }
    );
  }
  const quote = await getQuote(quoteId);
  const inquiry = quote ? await getInquiry(quote.inquiry_id) : null;
  if (
    !quote ||
    quote.status !== "pending" ||
    !inquiry ||
    inquiry.client_email.toLowerCase() !== clientEmail.toLowerCase() ||
    (body.projectId && inquiry.project_id && body.projectId !== inquiry.project_id) ||
    Math.round(quote.amount * 100) !== Math.round(amount * 100)
  ) {
    return NextResponse.json(
      { error: "A confirmed quote amount is required before Checkout." },
      { status: 400 }
    );
  }

  if (shouldBypassExternalCheckout()) {
    return NextResponse.json({ url: `${appUrl}/dashboard?checkout=success&stub=1` });
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
    customer_email: clientEmail,
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
      project_id: body.projectId ?? inquiry.project_id ?? "",
      quote_id: quote.id
    },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/creators?checkout=cancelled`
  });

  return NextResponse.json({ url: session.url });
}
