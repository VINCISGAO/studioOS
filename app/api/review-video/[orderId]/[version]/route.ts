import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getCurrentCreatorId } from "@/lib/creator-session";
import {
  assertDeliverableVideoAccess,
  getDeliverableRetentionDeleteAfter,
  purgeExpiredDeliverableVideos,
  recordBrandFinalDeliverableDownload
} from "@/lib/studioos/deliverable-video-policy";
import { reviewVideoFilePath } from "@/lib/studioos/video-upload";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string; version: string }> }
) {
  await purgeExpiredDeliverableVideos();

  const { orderId, version } = await context.params;
  const versionNum = Number(version);
  if (!orderId || !Number.isFinite(versionNum) || versionNum < 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const [clientEmail, creatorId] = await Promise.all([getCurrentClientEmail(), getCurrentCreatorId()]);
  const access = await assertDeliverableVideoAccess({
    orderId,
    version: versionNum,
    clientEmail,
    creatorId
  });

  if (!access.ok) {
    if (access.code === "PURGED") {
      return NextResponse.json(
        {
          error:
            "This video was automatically removed from the server after the retention period. Please use your local copy."
        },
        { status: 410 }
      );
    }
    if (access.code === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const { order, deliverable, isBrand } = access;

  const filePath = reviewVideoFilePath(orderId, versionNum);
  try {
    const data = await fs.readFile(filePath);

    let deleteAfter: string | null = null;
    if (download && isBrand && clientEmail) {
      const record = await recordBrandFinalDeliverableDownload({
        order,
        deliverable,
        clientEmail
      });
      deleteAfter =
        record?.delete_after ?? (await getDeliverableRetentionDeleteAfter(deliverable.id));
    }

    const filename = `studioos-${orderId}-v${versionNum}.mp4`;

    return new NextResponse(data, {
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": download ? "private, no-store" : "private, max-age=3600",
        "Content-Disposition": download ? `attachment; filename="${filename}"` : "inline",
        ...(deleteAfter ? { "X-Video-Delete-After": deleteAfter } : {})
      }
    });
  } catch {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
}
