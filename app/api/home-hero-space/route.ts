import { homeHeroSpaceResponse } from "@/lib/studioos/home-hero-space-asset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return homeHeroSpaceResponse();
}
