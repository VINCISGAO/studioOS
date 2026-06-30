import { homeHeroSpaceResponse } from "@/lib/studioos/home-hero-space-asset";

export const runtime = "nodejs";

export async function GET() {
  return homeHeroSpaceResponse();
}
