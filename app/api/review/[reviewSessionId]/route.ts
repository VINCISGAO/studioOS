import { NextResponse } from "next/server";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { getOrder } from "@/lib/order-service";
import { getReviewSessionPayload } from "@/lib/review-engine/review-engine-service";
import { getReviewSession } from "@/lib/review-engine/review-session-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ reviewSessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { reviewSessionId } = await context.params;
  const session = await getReviewSession(reviewSessionId);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Review session not found" }, { status: 404 });
  }

  const order = await getOrder(session.order_id);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  const creatorId = await getCurrentCreatorId();
  const clientEmail = await getCurrentClientEmail();

  const isCreator = creatorId && order.creator_id === creatorId;
  const isBrand = clientEmail && order.client_email.toLowerCase() === clientEmail.toLowerCase();

  if (!isCreator && !isBrand) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getReviewSessionPayload(reviewSessionId);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Review session not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    status: payload.status,
    version: payload.version,
    reviewLink: payload.reviewLink,
    title: payload.title,
    versionNotes: payload.versionNotes,
    events: payload.events,
    demoMode: payload.demoMode
  });
}
