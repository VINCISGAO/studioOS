import { NextResponse } from "next/server";
import { campaignAssetObjectKey } from "@/lib/studioos/campaign-asset-upload";
import { getObject } from "@/lib/studioos/object-storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ campaignId: string; filename: string }> }
) {
  const { campaignId, filename } = await context.params;
  if (!campaignId || !filename) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const safeName = decodeURIComponent(filename).replace(/[/\\]/g, "");
  const fileKey = campaignAssetObjectKey(campaignId, safeName);

  try {
    const data = await getObject(fileKey);
    if (!data) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    const ext = safeName.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/jpeg";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
