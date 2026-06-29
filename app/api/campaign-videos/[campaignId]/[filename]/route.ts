import { NextResponse } from "next/server";
import { videoConfig } from "@/lib/core/config/video";

export async function GET() {
  if (videoConfig.enforceHlsOnly) {
    return NextResponse.json(
      { error: "Direct MP4 playback disabled — use signed HLS (ADR-002)" },
      { status: 403 }
    );
  }

  return NextResponse.json({ error: "Route disabled" }, { status: 404 });
}
