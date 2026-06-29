import { homeHeroBgResponse } from "@/lib/studioos/home-hero-bg-asset";

export const runtime = "nodejs";

/** @deprecated Prefer /api/home-hero-bg — kept for old bookmarks. */
export async function GET() {
  return homeHeroBgResponse();
}
