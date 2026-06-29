import { homeHeroStudioResponse } from "@/lib/studioos/home-hero-studio-asset";

export const runtime = "nodejs";

export async function GET() {
  return homeHeroStudioResponse();
}
