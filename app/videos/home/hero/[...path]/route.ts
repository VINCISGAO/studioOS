import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_HERO_UPSTREAM = "https://pub-f68761fae15346faa85da45b7929e5bb.r2.dev";

const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified"
] as const;

function marketingHeroUpstream(): string {
  const raw = process.env.MARKETING_CDN_UPSTREAM?.trim();
  if (raw) return raw.replace(/\/+$/u, "");
  return DEFAULT_HERO_UPSTREAM;
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function buildHeroVideoTarget(upstream: string, path: string[]): string {
  const encoded = path.map(decodePathSegment).map((segment) => encodeURIComponent(segment)).join("/");
  return `${upstream}/videos/home/hero/${encoded}`;
}

async function proxyHeroVideo(request: Request, path: string[]): Promise<Response> {
  if (!path.length) {
    return NextResponse.json({ error: "Missing hero video path" }, { status: 404 });
  }

  const target = buildHeroVideoTarget(marketingHeroUpstream(), path);
  const upstreamHeaders = new Headers();
  const range = request.headers.get("range");
  if (range) upstreamHeaders.set("range", range);
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch) upstreamHeaders.set("if-none-match", ifNoneMatch);

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(target, {
      method: request.method === "HEAD" ? "HEAD" : "GET",
      headers: upstreamHeaders
    });
  } catch {
    return NextResponse.json({ error: "Hero video upstream fetch failed" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const key of PASSTHROUGH_HEADERS) {
    const value = upstreamRes.headers.get(key);
    if (value) responseHeaders.set(key, value);
  }
  responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(request.method === "HEAD" ? null : upstreamRes.body, {
    status: upstreamRes.status,
    headers: responseHeaders
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyHeroVideo(request, path);
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyHeroVideo(request, path);
}
