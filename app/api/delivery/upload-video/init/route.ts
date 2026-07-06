import { NextResponse } from "next/server";
import { MAX_DELIVERABLE_VIDEO_BYTES } from "@/lib/studioos/deliverable-video-policy-shared";
import { reviewVideoObjectKey, reviewVideoPublicUrl } from "@/lib/studioos/video-upload";
import { createMultipartObjectUpload } from "@/lib/studioos/object-storage";

export const runtime = "nodejs";

function videoExtension(fileName: string, mimeType: string): "mp4" | "mov" | null {
  const lower = fileName.toLowerCase();
  if (mimeType === "video/mp4" || lower.endsWith(".mp4")) return "mp4";
  if (mimeType === "video/quicktime" || lower.endsWith(".mov")) return "mov";
  return null;
}

export async function POST(request: Request) {
  const [
    { getCurrentCreatorId },
    { listDeliverablesForUpload, getOrder },
    { paidRevisionService },
    {
      resolveReviewUploadVersionForOrder,
      filterPlayableDeliverables,
      blocksCreatorNewVersionUpload,
      latestSubmittedDeliverableVersion
    },
    { assertReviewVersionUploadAllowed },
    { MAX_CAMPAIGN_VERSIONS }
  ] = await Promise.all([
    import("@/lib/creator-session"),
    import("@/lib/order-service"),
    import("@/features/review/paid-revision.service"),
    import("@/lib/studioos/review-upload-version"),
    import("@/features/review/review-round-policy"),
    import("@/features/delivery/version.repository")
  ]);

  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    order_id?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
  } | null;
  const orderId = String(body?.order_id ?? "").trim();
  const fileName = String(body?.file_name ?? "").trim();
  const fileSize = Number(body?.file_size ?? 0);
  const mimeType = String(body?.mime_type ?? "application/octet-stream").trim();

  if (!orderId || !fileName || !Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ ok: false, error: "order_id, file_name and file_size are required" }, { status: 400 });
  }
  if (fileSize > MAX_DELIVERABLE_VIDEO_BYTES) {
    return NextResponse.json({ ok: false, error: "File exceeds 500 MB limit" }, { status: 400 });
  }

  const extension = videoExtension(fileName, mimeType);
  if (!extension) {
    return NextResponse.json({ ok: false, error: "Only MP4 / MOV videos are supported" }, { status: 400 });
  }

  const order = await getOrder(orderId);
  if (!order || order.creator_id !== creatorId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!["paid", "in_production", "revision", "review"].includes(order.status)) {
    return NextResponse.json({ ok: false, error: "Cannot upload in the current order status" }, { status: 400 });
  }

  const paidPolicy = await paidRevisionService.resolvePolicyForOrder({
    orderId,
    projectId: order.project_id
  });
  const deliverables = (await listDeliverablesForUpload(orderId)).sort((a, b) => a.version - b.version);
  const uploadTarget = await resolveReviewUploadVersionForOrder(
    orderId,
    deliverables,
    order.status,
    paidPolicy.paidRevisionSlotsUnlocked
  );
  const latestSubmitted = latestSubmittedDeliverableVersion(deliverables);
  if (
    blocksCreatorNewVersionUpload({
      orderStatus: order.status,
      replace: uploadTarget.replace,
      latestSubmitted
    })
  ) {
    return NextResponse.json({ ok: false, error: "Cannot upload in the current order status" }, { status: 400 });
  }
  const uploadGate = assertReviewVersionUploadAllowed({
    targetVersion: uploadTarget.version,
    paidSlotsUnlocked: paidPolicy.paidRevisionSlotsUnlocked
  });
  if (!uploadGate.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: uploadGate.code === "PAYMENT_REQUIRED" ? "Paid revision unlock required" : "Maximum review versions reached"
      },
      { status: uploadGate.code === "PAYMENT_REQUIRED" ? 402 : 409 }
    );
  }
  const playableCount = (await filterPlayableDeliverables(orderId, deliverables)).length;
  if (!uploadTarget.replace && playableCount >= MAX_CAMPAIGN_VERSIONS) {
    return NextResponse.json({ ok: false, error: "Maximum of 5 review versions reached" }, { status: 400 });
  }

  const key = reviewVideoObjectKey(orderId, uploadTarget.version, extension);
  let upload: Awaited<ReturnType<typeof createMultipartObjectUpload>>;
  try {
    upload = await createMultipartObjectUpload(key, extension === "mov" ? "video/quicktime" : "video/mp4");
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to initialize video upload"
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    upload_id: upload.uploadId,
    key,
    version: uploadTarget.version,
    url: reviewVideoPublicUrl(orderId, uploadTarget.version),
    part_size: 16 * 1024 * 1024
  });
}
