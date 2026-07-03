import { NextResponse } from "next/server";
import { readDemoReviewVideoBytes } from "@/lib/studioos/demo-review-video-bytes";

export const runtime = "nodejs";

export async function GET() {
  const data = await readDemoReviewVideoBytes();
  if (!data) {
    return NextResponse.json({ error: "Demo review video missing" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=86400",
      "Accept-Ranges": "bytes"
    }
  });
}
