import { promises as fs } from "node:fs";
import path from "node:path";
import { marketingCdnBaseUrl } from "@/lib/marketing/home-hero-video-sources";

const PASSTHROUGH_HEADERS = [
  "accept-ranges",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified"
] as const;

const ALLOWED_PREFIXES = ["/videos/home/hero/", "/videos/home/recent-work/"] as const;

const DEFAULT_MARKETING_CDN = "https://pub-f68761fae15346faa85da45b7929e5bb.r2.dev";

export function isMarketingHomeVideoPath(pathname: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function encodePathname(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => (segment ? encodeURIComponent(segment) : ""))
    .join("/");
}

function videoMimeType(pathname: string): string {
  return /\.mp4$/i.test(pathname) ? "video/mp4" : "application/octet-stream";
}

function resolveMarketingCdnUpstream(): string {
  return (marketingCdnBaseUrl() ?? DEFAULT_MARKETING_CDN).replace(/\/+$/u, "");
}

function buildUpstreamUrl(pathname: string): string {
  return `${resolveMarketingCdnUpstream()}${encodePathname(pathname)}`;
}

function cacheHeaders(): HeadersInit {
  return {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes"
  };
}

async function readLocalPublicVideo(
  pathname: string,
  rangeHeader: string | null,
  method: string
): Promise<Response | null> {
  const localPath = path.join(process.cwd(), "public", pathname.replace(/^\/+/u, ""));
  let stat: Awaited<ReturnType<typeof fs.stat>>;
  try {
    stat = await fs.stat(localPath);
    if (!stat.isFile()) return null;
  } catch {
    return null;
  }

  const total = stat.size;
  const mime = videoMimeType(pathname);
  const baseHeaders = { ...cacheHeaders(), "Content-Type": mime };

  if (method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(total) }
    });
  }

  if (!rangeHeader) {
    const body = await fs.readFile(localPath);
    return new Response(body, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(total) }
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/u.exec(rangeHeader.trim());
  if (!match) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : total - 1;
  if (start >= total || end >= total || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }

  const length = end - start + 1;
  const handle = await fs.open(localPath, "r");
  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, start);
    return new Response(buffer, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(length),
        "Content-Range": `bytes ${start}-${end}/${total}`
      }
    });
  } finally {
    await handle.close();
  }
}

export async function proxyMarketingHomeVideo(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  if (!isMarketingHomeVideoPath(pathname)) {
    return new Response("Not Found", { status: 404 });
  }

  const rangeHeader = request.headers.get("range");
  const local = await readLocalPublicVideo(pathname, rangeHeader, method);
  if (local) return local;

  const upstreamUrl = buildUpstreamUrl(pathname);
  const upstreamHeaders: HeadersInit = {};
  if (rangeHeader) upstreamHeaders.Range = rangeHeader;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      redirect: "follow"
    });
  } catch {
    return new Response("Upstream unavailable", { status: 502 });
  }

  const headers = new Headers();
  for (const key of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }
  if (!headers.has("content-type")) {
    headers.set("content-type", videoMimeType(pathname));
  }
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (!headers.has("accept-ranges")) {
    headers.set("Accept-Ranges", "bytes");
  }

  return new Response(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers
  });
}
