import { NextResponse } from "next/server";
import { completeMultipartObjectUpload } from "@/lib/studioos/object-storage";
import { reviewVideoObjectKey, reviewVideoPublicUrl } from "@/lib/studioos/video-upload";
import { assertReviewVideoUploadGate } from "@/lib/studioos/review-video-upload-gate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const [
    { getCurrentCreatorId },
    { getOrder, listDeliverablesForUpload },
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
    import("@/features/auth/session-context"),
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
  if (
    !parts.every(
      (part) =>
        Number.isInteger(part.partNumber) &&
        part.partNumber >= 1 &&
        typeof part.etag === "string" &&
        part.etag.trim().length > 0
    )
  ) {
    return NextResponse.json({ ok: false, error: "Invalid upload completion request" }, { status: 400 });
  }

  const order = await getOrder(orderId);
  if (!order || order.creator_id !== creatorId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const campaignGate = await assertReviewVideoUploadGate({ order, creatorId });
  if (!campaignGate.ok) {
    return NextResponse.json({ ok: false, error: campaignGate.error }, { status: campaignGate.status });
  }
  if (key !== reviewVideoObjectKey(orderId, version, "mp4") && key !== reviewVideoObjectKey(orderId, version, "mov")) {
    return NextResponse.json({ ok: false, error: "Invalid upload completion request" }, { status: 400 });
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
  if (uploadTarget.version !== version) {
    return NextResponse.json({ ok: false, error: "Invalid upload completion request" }, { status: 409 });
  }
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
    targetVersion: version,
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
