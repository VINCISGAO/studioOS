import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function marketingHeroUpstream(): string | null {
  const raw = process.env.MARKETING_CDN_UPSTREAM?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/u, "");
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function buildHeroVideoTarget(upstream: string, path: string[]): string {
  const objectKey = path.map(decodePathSegment).join("/");
  const relative = `/videos/home/hero/${objectKey}`;
  return `${upstream}${encodeURI(relative)}`;
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
  if (!path.length) {
    return NextResponse.json({ error: "Missing hero video path" }, { status: 404 });
  }

  return NextResponse.redirect(buildHeroVideoTarget(upstream, path), 307);
}

export async function HEAD(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const upstream = marketingHeroUpstream();
  if (!upstream) {
    return new Response(null, { status: 404 });
  }

  const { path } = await context.params;
  if (!path.length) {
    return new Response(null, { status: 404 });
  }

  return NextResponse.redirect(buildHeroVideoTarget(upstream, path), 307);
}
