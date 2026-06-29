import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyFrameIoWebhookSignature } from "@/lib/frameio";
import { handleFrameIoWebhookEvent } from "@/lib/review-engine/review-engine-service";
import { invalidateReviewEngineStore } from "@/lib/review-engine/review-session-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headerStore = await headers();
  const signature =
    headerStore.get("x-frameio-signature") ??
    headerStore.get("x-webhook-signature") ??
    headerStore.get("frameio-signature");

  if (!verifyFrameIoWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const result = await handleFrameIoWebhookEvent(payload);
    invalidateReviewEngineStore();

    if (!result.ok) {
      return NextResponse.json({ received: true, handled: false, reason: result.reason });
    }

    return NextResponse.json({
      received: true,
      handled: true,
      eventType: result.eventType,
      reviewSessionId: result.session?.id,
      status: result.session?.status
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
