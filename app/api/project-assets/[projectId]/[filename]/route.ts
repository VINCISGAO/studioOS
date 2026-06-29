import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { projectAssetFilePath } from "@/lib/studioos/project-asset-upload";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string; filename: string }> }
) {
  const { projectId, filename } = await context.params;
  if (!projectId || !filename) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const safeName = decodeURIComponent(filename).replace(/[/\\]/g, "");
  const filePath = projectAssetFilePath(projectId, safeName);

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
