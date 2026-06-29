import { homeHeroBgResponse } from "@/lib/studioos/home-hero-bg-asset";

export const runtime = "nodejs";

export async function GET() {
  return homeHeroBgResponse();
}
