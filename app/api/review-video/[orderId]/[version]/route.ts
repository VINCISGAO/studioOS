import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { reviewVideoFilePath } from "@/lib/studioos/video-upload";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string; version: string }> }
) {
  const { orderId, version } = await context.params;
  const versionNum = Number(version);
  if (!orderId || !Number.isFinite(versionNum) || versionNum < 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const filePath = reviewVideoFilePath(orderId, versionNum);
  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
}
