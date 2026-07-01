import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const [
    { getCurrentCreatorId },
    { getDeliverables, getOrder },
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

    if (hasDatabaseUrl() && order.project_id) {
      const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
      if (campaign) {
        const deliverables = await versionService.listDeliverablesForLegacyProject(
          order.project_id,
          orderId
        );
        const count = deliverables?.length ?? 0;
        if (count >= MAX_CAMPAIGN_VERSIONS) {
          return NextResponse.json(
            { ok: false, error: "Maximum of 3 review versions reached" },
            { status: 400 }
          );
        }
        const nextVersion = count + 1;
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
