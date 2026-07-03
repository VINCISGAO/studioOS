import { NextResponse } from "next/server";
import { brandAvatarObjectKey } from "@/lib/studioos/brand-avatar-upload";
import { getObject } from "@/lib/studioos/object-storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ brandId: string; fileName: string }> }
) {
  const { brandId, fileName } = await context.params;
  if (!brandId || !fileName) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const safeName = decodeURIComponent(fileName).replace(/[/\\]/g, "");
  const fileKey = brandAvatarObjectKey(brandId, safeName);

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
