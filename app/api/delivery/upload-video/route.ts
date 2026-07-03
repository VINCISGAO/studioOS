import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const [
    { getCurrentCreatorId },
    { listDeliverablesForUpload, getOrder },
    { purgeExpiredDeliverableVideos },
    { saveReviewVideoUpload }
  ] = await Promise.all([
    import("@/lib/creator-session"),
    import("@/lib/order-service"),
    import("@/lib/studioos/deliverable-video-policy"),
    import("@/lib/studioos/video-upload")
  ]);

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

    const [
      { hasDatabaseUrl },
      { campaignRepository },
      { MAX_CAMPAIGN_VERSIONS },
      {
        resolveReviewUploadVersionForOrder,
        filterPlayableDeliverables,
        blocksCreatorNewVersionUpload,
        latestSubmittedDeliverableVersion
      },
      { paidRevisionService },
      { assertReviewVersionUploadAllowed }
    ] = await Promise.all([
      import("@/lib/core/database/prisma"),
      import("@/features/campaign/campaign.repository"),
      import("@/features/delivery/version.repository"),
      import("@/lib/studioos/review-upload-version"),
      import("@/features/review/paid-revision.service"),
      import("@/features/review/review-round-policy")
    ]);

    const paidPolicy = await paidRevisionService.resolvePolicyForOrder({
      orderId,
      projectId: order.project_id
    });

    if (hasDatabaseUrl() && order.project_id) {
      const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
      if (campaign) {
        const deliverables = (await listDeliverablesForUpload(orderId)).sort(
          (a, b) => a.version - b.version
        );
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
          return NextResponse.json(
            { ok: false, error: "Cannot upload in the current order status" },
            { status: 400 }
          );
        }
        const uploadGate = assertReviewVersionUploadAllowed({
          targetVersion: uploadTarget.version,
          paidSlotsUnlocked: paidPolicy.paidRevisionSlotsUnlocked
        });
        if (!uploadGate.ok) {
          return NextResponse.json(
            {
              ok: false,
              error:
                uploadGate.code === "PAYMENT_REQUIRED"
                  ? "Paid revision unlock required"
                  : "Maximum review versions reached"
            },
            { status: uploadGate.code === "PAYMENT_REQUIRED" ? 402 : 409 }
          );
        }
        const playableCount = (await filterPlayableDeliverables(orderId, deliverables)).length;
        if (!uploadTarget.replace && playableCount >= MAX_CAMPAIGN_VERSIONS) {
          return NextResponse.json(
            { ok: false, error: "Maximum of 3 review versions reached" },
            { status: 400 }
          );
        }
        const saved = await saveReviewVideoUpload(orderId, uploadTarget.version, file, "en");
        if (!saved.ok) {
          return NextResponse.json({ ok: false, error: saved.error }, { status: 400 });
        }
        return NextResponse.json({
          ok: true,
          url: saved.url,
          version: uploadTarget.version,
          file_name: saved.file_name
        });
      }
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

    const deliverables = await listDeliverablesForUpload(orderId);
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
      return NextResponse.json(
        { ok: false, error: "Cannot upload in the current order status" },
        { status: 400 }
      );
    }
    const uploadGate = assertReviewVersionUploadAllowed({
      targetVersion: uploadTarget.version,
      paidSlotsUnlocked: paidPolicy.paidRevisionSlotsUnlocked
    });
    if (!uploadGate.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            uploadGate.code === "PAYMENT_REQUIRED"
              ? "Paid revision unlock required"
              : "Maximum review versions reached"
        },
        { status: uploadGate.code === "PAYMENT_REQUIRED" ? 402 : 409 }
      );
    }
    const playableCount = (await filterPlayableDeliverables(orderId, deliverables)).length;
    if (!uploadTarget.replace && playableCount >= MAX_CAMPAIGN_VERSIONS) {
      return NextResponse.json(
        { ok: false, error: "Maximum of 3 review versions reached" },
        { status: 400 }
      );
    }
    const saved = await saveReviewVideoUpload(orderId, uploadTarget.version, file, "en");

    if (!saved.ok) {
      return NextResponse.json({ ok: false, error: saved.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      url: saved.url,
      version: uploadTarget.version,
      file_name: saved.file_name
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
