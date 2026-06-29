import { NextResponse } from "next/server";
import { videoConfig } from "@/lib/core/config/video";

export async function GET() {
  if (videoConfig.enforceHlsOnly) {
    return NextResponse.json(
      { error: "Legacy HLS route disabled — use /api/v1/playback/{token}" },
      { status: 403 }
    );
  }

  return NextResponse.json({ error: "Route disabled" }, { status: 404 });
}
