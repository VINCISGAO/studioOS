import { NextResponse } from "next/server";
import { getBrandProfileById } from "@/lib/brand-profile-service";
import { brandAvatarObjectKey } from "@/lib/studioos/brand-avatar-upload";
import { getObject, getObjectMetadata, getObjectRange } from "@/lib/studioos/object-storage";

const ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";

function mimeForFileName(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "mp4") return "video/mp4";
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  return "image/jpeg";
}

function parseRange(range: string | null, total: number | null) {
  if (!range || total == null) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return null;
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : total - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
    return null;
  }
  return { start, end: Math.min(end, total - 1) };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ brandId: string; fileName: string }> }
) {
  const { brandId, fileName } = await context.params;
  if (!brandId || !fileName) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const safeName = decodeURIComponent(fileName).replace(/[/\\]/g, "");
  const safeBrandId = decodeURIComponent(brandId).replace(/[/\\]/g, "");

  const profile = await getBrandProfileById(safeBrandId);
  if (!profile) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const fileKey = brandAvatarObjectKey(safeBrandId, safeName);
  const mime = mimeForFileName(safeName);

  try {
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      const metadata = await getObjectMetadata(fileKey);
      const range = parseRange(rangeHeader, metadata?.contentLength ?? null);
      if (!range) {
        return NextResponse.json({ error: "Invalid range" }, { status: 416 });
      }

      const chunk = await getObjectRange(fileKey, range);
      if (!chunk) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          "Content-Type": mime,
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${range.start}-${range.end}/${metadata?.contentLength ?? "*"}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": ASSET_CACHE_CONTROL
        }
      });
    }

    const data = await getObject(fileKey);
    if (!data) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(data.length),
        "Accept-Ranges": "bytes",
        "Cache-Control": ASSET_CACHE_CONTROL
      }
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
