import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getDeliverables, getOrder } from "@/lib/order-service";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import { userRepository } from "@/features/auth/user.repository";
import { versionRepository } from "@/features/delivery/version.repository";
import {
  createPlaybackToken,
  signedPlaybackManifestUrl
} from "@/features/video/playback-token.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { readDemoReviewVideoBytes } from "@/lib/studioos/demo-review-video-bytes";
import {
  assertDeliverableVideoAccess,
  getDeliverableRetentionDeleteAfter,
  purgeExpiredDeliverableVideos,
  recordBrandFinalDeliverableDownload
} from "@/lib/studioos/deliverable-video-policy";
import {
  findReviewVideoFile,
  findReviewVideoObject,
  readReviewVideoObjectRange
} from "@/lib/studioos/video-upload";

export const runtime = "nodejs";

function isDevDemoOrder(orderId: string) {
  return process.env.NODE_ENV === "development" && orderId.startsWith("ord_demo_");
}

async function readVideoBytes(filePath: string, allowDemoFallback: boolean) {
  try {
    return await fs.readFile(filePath);
  } catch {
    if (!allowDemoFallback) {
      return null;
    }
    return readDemoReviewVideoBytes();
  }
}

function parseRangeHeader(rangeHeader: string | null, fileSize: number) {
  if (!rangeHeader) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return null;

  const [, startRaw, endRaw] = match;
  if (!startRaw && !endRaw) return null;

  if (!startRaw) {
    const suffixLength = Number(endRaw);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    const start = Math.max(fileSize - suffixLength, 0);
    return { start, end: fileSize - 1 };
  }

  const start = Number(startRaw);
  const end = endRaw ? Number(endRaw) : fileSize - 1;
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    start >= fileSize
  ) {
    return null;
  }

  return { start, end: Math.min(end, fileSize - 1) };
}

async function readVideoRange(filePath: string, start: number, end: number) {
  const length = end - start + 1;
  const file = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    await file.read(buffer, 0, length, start);
    return buffer;
  } finally {
    await file.close();
  }
}

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
  let access = await assertDeliverableVideoAccess({
    orderId,
    version: versionNum,
    clientEmail,
    creatorId
  });

  if (!access.ok && isDevDemoOrder(orderId) && access.code === "FORBIDDEN") {
    const order = await getOrder(orderId);
    const deliverables = order ? await getDeliverables(orderId) : [];
    const deliverable = deliverables.find((item) => item.version === versionNum) ?? null;
    if (order && deliverable) {
      access = { ok: true as const, order, deliverable, isBrand: false };
    }
  }

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

  if (download && (!isBrand || order.status !== "completed")) {
    return NextResponse.json(
      { error: "Original downloads are only available after final approval." },
      { status: 403 }
    );
  }

  if (!download && isBrand && hasDatabaseUrl() && order.project_id && clientEmail) {
    const campaign = await campaignRepository.findByLegacyProjectId(order.project_id);
    const brandUser = await userRepository.findByEmail(clientEmail.toLowerCase());
    const campaignVersion = campaign
      ? await versionRepository.findByCampaignAndVersionNumber(campaign.id, versionNum)
      : null;

    if (campaignVersion) {
      if (campaignVersion.status !== "READY" || campaignVersion.reviewStatus !== "READY") {
        return NextResponse.json(
          { error: "Video is still processing. Please try again after transcoding completes." },
          { status: 409 }
        );
      }

      if (!campaignVersion.hlsUrl) {
        return NextResponse.json(
          { error: "HLS playback is not ready yet." },
          { status: 409 }
        );
      }

      if (!campaign || !brandUser) {
        return NextResponse.json({ error: "Playback user not found" }, { status: 403 });
      }

      const token = createPlaybackToken({
        versionId: campaignVersion.id,
        userId: brandUser.id,
        campaignId: campaign.id
      });
      return NextResponse.redirect(new URL(signedPlaybackManifestUrl(token), request.url));
    }
  }

  const videoObject = await findReviewVideoObject(orderId, versionNum);
  const videoFile = videoObject ? null : await findReviewVideoFile(orderId, versionNum);
  if (!videoObject && !videoFile) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const allowDemoFallback = isDevDemoOrder(orderId);
  let fileSize: number | null = videoObject?.contentLength ?? null;
  if (!videoObject && videoFile) {
    try {
      fileSize = (await fs.stat(videoFile.path)).size;
    } catch {
      fileSize = null;
    }
  }

  const range = fileSize != null ? parseRangeHeader(request.headers.get("range"), fileSize) : null;
  if (range && fileSize != null) {
    const data = videoObject
      ? await readReviewVideoObjectRange(videoObject.key, range)
      : videoFile
        ? await readVideoRange(videoFile.path, range.start, range.end)
        : null;
    if (!data) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    const contentLength = range.end - range.start + 1;
    return new NextResponse(new Uint8Array(data), {
      status: 206,
      headers: {
        "Content-Type": videoObject?.contentType ?? videoFile?.contentType ?? "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Length": String(contentLength),
        "Content-Range": `bytes ${range.start}-${range.end}/${fileSize}`,
        "Cache-Control": download ? "private, no-store" : "private, max-age=3600",
        "Content-Disposition": download
          ? `attachment; filename="studioos-${orderId}-v${versionNum}.${videoObject?.extension ?? videoFile?.extension ?? "mp4"}"`
          : "inline"
      }
    });
  }

  const data = videoObject
    ? await readReviewVideoObjectRange(videoObject.key)
    : videoFile
      ? await readVideoBytes(videoFile.path, allowDemoFallback)
      : null;
  if (!data) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

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

  const filename = `studioos-${orderId}-v${versionNum}.${videoObject?.extension ?? videoFile?.extension ?? "mp4"}`;

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": videoObject?.contentType ?? videoFile?.contentType ?? "video/mp4",
      "Accept-Ranges": "bytes",
      "Content-Length": String(data.byteLength),
      "Cache-Control": download ? "private, no-store" : "private, max-age=3600",
      "Content-Disposition": download ? `attachment; filename="${filename}"` : "inline",
      ...(deleteAfter ? { "X-Video-Delete-After": deleteAfter } : {})
    }
  });
}
