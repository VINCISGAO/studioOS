import { NextResponse } from "next/server";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getDeliverables, getOrder } from "@/lib/order-service";
import { purgeExpiredDeliverableVideos } from "@/lib/studioos/deliverable-video-policy";
import { saveReviewVideoUpload } from "@/lib/studioos/video-upload";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  await purgeExpiredDeliverableVideos();

  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const orderId = String(formData.get("order_id") ?? "").trim();
    const file = formData.get("video_file");

    if (!orderId || !(file instanceof File) || !file.size) {
      return NextResponse.json(
        { ok: false, error: "order_id and video_file are required" },
        { status: 400 }
      );
    }

    const order = await getOrder(orderId);
    if (!order || order.creator_id !== creatorId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!["in_production", "revision", "review"].includes(order.status)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Cannot upload in the current order status"
        },
        { status: 400 }
      );
    }

    const deliverables = await getDeliverables(orderId);
    const nextVersion = deliverables.length + 1;
    const saved = await saveReviewVideoUpload(orderId, nextVersion, file, "en");

    if (!saved.ok) {
      return NextResponse.json({ ok: false, error: saved.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      url: saved.url,
      version: nextVersion,
      file_name: saved.file_name
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
