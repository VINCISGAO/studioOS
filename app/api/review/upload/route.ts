import { NextResponse } from "next/server";
import { getCurrentCreatorId } from "@/features/auth/session-context";
import { getOrder } from "@/lib/order-service";
import { getReviewSession, uploadReviewVideoFile } from "@/lib/review-engine/review-engine-service";

export const runtime = "nodejs";

type UploadJsonBody = {
  reviewSessionId?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  versionNotes?: string;
};

export async function POST(request: Request) {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const reviewSessionId = String(formData.get("reviewSessionId") ?? "").trim();
      const versionNotes = String(formData.get("versionNotes") ?? "").trim() || undefined;
      const file = formData.get("file");

      if (!reviewSessionId || !(file instanceof File) || !file.size) {
        return NextResponse.json(
          { ok: false, error: "reviewSessionId and file are required" },
          { status: 400 }
        );
      }

      const session = await getReviewSession(reviewSessionId);
      if (!session || session.creator_id !== creatorId) {
        return NextResponse.json({ ok: false, error: "Review session not found" }, { status: 404 });
      }

      const order = await getOrder(session.order_id);
      if (!order || order.creator_id !== creatorId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }

      const updated = await uploadReviewVideoFile({
        reviewSessionId,
        file,
        versionNotes
      });

      const { invalidateReviewEngineStore } = await import("@/lib/review-engine/review-session-store");
      invalidateReviewEngineStore();

      return NextResponse.json({
        ok: true,
        reviewSessionId: updated.id,
        status: updated.status,
        reviewLink: updated.frame_review_link,
        version: updated.version_number
      });
    }

    const body = (await request.json()) as UploadJsonBody;
    const reviewSessionId = body.reviewSessionId?.trim();
    if (!reviewSessionId) {
      return NextResponse.json({ ok: false, error: "reviewSessionId is required" }, { status: 400 });
    }

    const session = await getReviewSession(reviewSessionId);
    if (!session || session.creator_id !== creatorId) {
      return NextResponse.json({ ok: false, error: "Review session not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      reviewSessionId: session.id,
      status: session.status,
      message:
        "Use multipart/form-data with a file field to upload video. JSON body registers upload intent only."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
