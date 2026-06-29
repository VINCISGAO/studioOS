import { NextResponse } from "next/server";
import { HERO_VIDEO_SRC } from "@/lib/hero-video";

/** @deprecated Prefer static {HERO_VIDEO_SRC} — kept for old bookmarks. */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL(HERO_VIDEO_SRC, request.url), 308);
}
