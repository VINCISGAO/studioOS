import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { brandAvatarFilePath } from "@/lib/studioos/brand-avatar-upload";

export async function GET(
  _request: Request,
  context: { params: Promise<{ brandId: string; fileName: string }> }
) {
  const { brandId, fileName } = await context.params;
  if (!brandId || !fileName) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const safeName = decodeURIComponent(fileName).replace(/[/\\]/g, "");
  const filePath = brandAvatarFilePath(brandId, safeName);

  try {
    const data = await fs.readFile(filePath);
    const ext = safeName.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/jpeg";

    return new NextResponse(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
