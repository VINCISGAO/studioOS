import { homeHeroStudioResponse } from "@/lib/studioos/home-hero-studio-asset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return homeHeroStudioResponse();
}
