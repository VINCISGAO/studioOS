import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { creatorAvatarFilePath } from "@/lib/studioos/creator-avatar-upload";

export async function GET(
  _request: Request,
  context: { params: Promise<{ creatorId: string; fileName: string }> }
) {
  const { creatorId, fileName } = await context.params;
  if (!creatorId || !fileName) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const safeName = decodeURIComponent(fileName).replace(/[/\\]/g, "");
  const filePath = creatorAvatarFilePath(creatorId, safeName);

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
