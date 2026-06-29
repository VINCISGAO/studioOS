import { NextResponse } from "next/server";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getOrder } from "@/lib/order-service";
import {
  createReviewSession,
  ensureReviewSessionForOrder
} from "@/lib/review-engine/review-engine-service";

export const runtime = "nodejs";

type CreateSessionBody = {
  campaignId?: string;
  orderId?: string;
  creatorId?: string;
  brandId?: string;
  title?: string;
};

export async function POST(request: Request) {
  let body: CreateSessionBody;
  try {
    body = (await request.json()) as CreateSessionBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "orderId is required" }, { status: 400 });
  }

  const order = await getOrder(orderId);
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

  try {
    const session = isCreator
      ? await ensureReviewSessionForOrder({
          orderId,
          creatorId: order.creator_id,
          brandId: order.client_email,
          title: body.title?.trim() || order.title
        })
      : await createReviewSession({
          campaignId: body.campaignId ?? order.project_id ?? order.id,
          orderId,
          creatorId: order.creator_id,
          brandId: order.client_email,
          title: body.title?.trim() || order.title
        });

    return NextResponse.json({
      ok: true,
      reviewSessionId: session.id,
      status: session.status,
      version: session.version_number
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create review session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
