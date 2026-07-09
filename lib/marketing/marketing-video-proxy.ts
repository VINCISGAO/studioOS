import { promises as fs } from "node:fs";
import path from "node:path";
import { isObjectStorageConfigured } from "@/lib/core/config/video";
import {
  homeHeroVideoObjectKey,
  homeHeroVideoRelativePaths,
  marketingCdnBaseUrl
} from "@/lib/marketing/home-hero-video-sources";
import { getObjectMetadata, getObjectRange } from "@/lib/studioos/object-storage";

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

function buildUpstreamUrlCandidates(pathname: string): string[] {
  const base = resolveMarketingCdnUpstream();
  const urls = new Set<string>([
    `${base}${encodePathname(pathname)}`,
    `${base}${encodeURI(pathname)}`
  ]);
  return [...urls];
}

function pathnameToObjectKey(pathname: string): string {
  return pathname.replace(/^\/+/u, "");
}

function objectKeyCandidates(pathname: string): string[] {
  const keys = new Set<string>();
  const primary = pathnameToObjectKey(pathname);
  keys.add(primary);
  keys.add(primary.normalize("NFC"));
  keys.add(primary.normalize("NFD"));

  const filename = pathname.split("/").pop() ?? "";
  for (const relative of Object.values(homeHeroVideoRelativePaths)) {
    if (relative === pathname || relative.endsWith(filename)) {
      keys.add(homeHeroVideoObjectKey(relative));
    }
  }

  return [...keys];
}

function cacheHeaders(): HeadersInit {
  return {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes"
  };
}

function parseByteRange(
  rangeHeader: string,
  total: number
): { start: number; end: number } | "invalid" | "unsatisfiable" {
  const match = /^bytes=(\d*)-(\d*)$/u.exec(rangeHeader.trim());
  if (!match) return "invalid";

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : total - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= total) {
    return "unsatisfiable";
  }

  return { start, end: Math.min(end, total - 1) };
}

function rangedHeadResponse(
  total: number,
  mime: string,
  rangeHeader: string,
  passthrough: Headers
): Response {
  const parsed = parseByteRange(rangeHeader, total);
  const baseHeaders = new Headers({
    ...Object.fromEntries(cacheHeaders()),
    "Content-Type": mime,
    "Accept-Ranges": "bytes"
  });

  for (const key of PASSTHROUGH_HEADERS) {
    const value = passthrough.get(key);
    if (value && key !== "content-length" && key !== "content-range" && key !== "content-type") {
      baseHeaders.set(key, value);
    }
  }

  if (parsed === "invalid" || parsed === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: { ...Object.fromEntries(baseHeaders), "Content-Range": `bytes */${total}` }
    });
  }

  const { start, end } = parsed;
  return new Response(null, {
    status: 206,
    headers: {
      ...Object.fromEntries(baseHeaders),
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${total}`
    }
  });
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
    if (rangeHeader) {
      return rangedHeadResponse(total, mime, rangeHeader, new Headers());
    }
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

  const parsed = parseByteRange(rangeHeader, total);
  if (parsed === "invalid" || parsed === "unsatisfiable") {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }

  const { start, end } = parsed;
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

async function resolveR2Object(
  pathname: string
): Promise<{ key: string; contentLength: number; contentType: string | null } | null> {
  if (!isObjectStorageConfigured()) return null;

  for (const key of objectKeyCandidates(pathname)) {
    const metadata = await getObjectMetadata(key);
    if (metadata?.contentLength) {
      return {
        key,
        contentLength: metadata.contentLength,
        contentType: metadata.contentType
      };
    }
  }

  return null;
}

async function serveFromR2Storage(
  pathname: string,
  rangeHeader: string | null,
  method: string
): Promise<Response | null> {
  const resolved = await resolveR2Object(pathname);
  if (!resolved) return null;

  const { key, contentLength: total, contentType } = resolved;
  const mime = contentType ?? videoMimeType(pathname);
  const baseHeaders = { ...cacheHeaders(), "Content-Type": mime };

  if (method === "HEAD") {
    if (rangeHeader) {
      return rangedHeadResponse(total, mime, rangeHeader, new Headers());
    }
    return new Response(null, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(total) }
    });
  }

  if (!rangeHeader) {
    const body = await getObjectRange(key);
    if (!body) return null;
    return new Response(body, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(total) }
    });
  }

  const parsed = parseByteRange(rangeHeader, total);
  if (parsed === "invalid" || parsed === "unsatisfiable") {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }

  const { start, end } = parsed;
  const body = await getObjectRange(key, parsed);
  if (!body) return null;

  return new Response(body, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Length": String(body.length),
      "Content-Range": `bytes ${start}-${end}/${total}`
    }
  });
}

async function fetchPublicCdn(
  pathname: string,
  method: string,
  rangeHeader: string | null
): Promise<Response | null> {
  const candidates = buildUpstreamUrlCandidates(pathname);

  for (const upstreamUrl of candidates) {
    const upstreamHeaders: HeadersInit = {};
    if (rangeHeader && method !== "HEAD") {
      upstreamHeaders.Range = rangeHeader;
    }

    try {
      const upstream = await fetch(upstreamUrl, {
        method,
        headers: upstreamHeaders,
        redirect: "follow"
      });
      if (upstream.ok || upstream.status === 206) {
        return upstream;
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function serveFromPublicCdn(
  pathname: string,
  rangeHeader: string | null,
  method: string
): Promise<Response> {
  if (method === "HEAD") {
    const upstream = await fetchPublicCdn(pathname, "HEAD", null);
    if (!upstream) {
      return new Response("Not Found", { status: 404 });
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

    const total = Number(headers.get("content-length") ?? 0);
    if (rangeHeader && total > 0) {
      return rangedHeadResponse(total, videoMimeType(pathname), rangeHeader, headers);
    }

    return new Response(null, { status: upstream.status, headers });
  }

  const upstream = await fetchPublicCdn(pathname, "GET", rangeHeader);
  if (!upstream) {
    return new Response("Not Found", { status: 404 });
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

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  });
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

  const fromR2 = await serveFromR2Storage(pathname, rangeHeader, method);
  if (fromR2) return fromR2;

  return serveFromPublicCdn(pathname, rangeHeader, method);
}
