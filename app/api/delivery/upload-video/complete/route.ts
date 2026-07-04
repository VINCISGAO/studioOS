import { NextResponse } from "next/server";
import { completeMultipartObjectUpload } from "@/lib/studioos/object-storage";
import { reviewVideoPublicUrl } from "@/lib/studioos/video-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const [{ getCurrentCreatorId }, { getOrder }] = await Promise.all([
    import("@/lib/creator-session"),
    import("@/lib/order-service")
  ]);
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    upload_id?: string;
    order_id?: string;
    key?: string;
    version?: number;
    parts?: Array<{ partNumber: number; etag: string }>;
  } | null;
  const uploadId = String(body?.upload_id ?? "").trim();
  const orderId = String(body?.order_id ?? "").trim();
  const key = String(body?.key ?? "").trim();
  const version = Number(body?.version ?? 0);
  const parts = Array.isArray(body?.parts) ? body.parts : [];

  if (!uploadId || !orderId || !key || !Number.isInteger(version) || version < 1 || !parts.length) {
    return NextResponse.json({ ok: false, error: "Invalid upload completion request" }, { status: 400 });
  }

  const order = await getOrder(orderId);
  if (!order || order.creator_id !== creatorId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await completeMultipartObjectUpload({
      key,
      uploadId,
      parts
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to complete video upload"
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    url: reviewVideoPublicUrl(orderId, version),
    version
  });
}
