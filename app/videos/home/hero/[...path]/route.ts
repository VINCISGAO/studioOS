import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function marketingHeroUpstream(): string | null {
  const raw = process.env.MARKETING_CDN_UPSTREAM?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/u, "");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const upstream = marketingHeroUpstream();
  if (!upstream) {
    return NextResponse.json({ error: "Hero video upstream not configured" }, { status: 404 });
  }

  const { path } = await context.params;
  const objectKey = path.map((segment) => decodeURIComponent(segment)).join("/");
  const target = new URL(`/videos/home/hero/${objectKey}`, upstream);

  return NextResponse.redirect(target, 307);
}
