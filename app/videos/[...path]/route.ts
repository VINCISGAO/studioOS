import { proxyMarketingHomeVideo } from "@/lib/marketing/marketing-video-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyMarketingHomeVideo(request);
}

export async function HEAD(request: Request) {
  return proxyMarketingHomeVideo(request);
}
