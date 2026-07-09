import { promises as fs } from "node:fs";
import path from "node:path";
import { isObjectStorageConfigured } from "@/lib/core/config/video";
import {
  homeHeroVideoObjectKey,
  homeHeroVideoPublicPaths,
  marketingCdnBaseUrl,
  resolveHeroR2ObjectKey
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

function encodeObjectKey(objectKey: string): string {
  return objectKey
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

function pathnameToObjectKey(pathname: string): string {
  return pathname.replace(/^\/+/u, "");
}

function objectKeyCandidates(pathname: string): string[] {
  const keys = new Set<string>();
  const mappedHero = resolveHeroR2ObjectKey(pathname);
  if (mappedHero) keys.add(mappedHero);

  const primary = pathnameToObjectKey(pathname);
  keys.add(primary);
  keys.add(primary.normalize("NFC"));
  keys.add(primary.normalize("NFD"));

  const parts = primary.split("/");
  const file = parts.pop();
  if (file) {
    const dir = parts.join("/");
    keys.add(`${dir}/${file.toLowerCase()}`);
    keys.add(`${dir}/${file.toUpperCase()}`);
    if (/\.mp4$/iu.test(file)) {
      keys.add(`${dir}/${file.replace(/\.mp4$/iu, ".mp4")}`);
      keys.add(`${dir}/${file.replace(/\.mp4$/iu, ".MP4")}`);
    }
  }

  const filename = pathname.split("/").pop() ?? "";
  for (const relative of Object.values(homeHeroVideoPublicPaths)) {
    if (relative === pathname || relative.endsWith(filename)) {
      keys.add(homeHeroVideoObjectKey(relative));
      const heroMapped = resolveHeroR2ObjectKey(relative);
      if (heroMapped) keys.add(heroMapped);
    }
  }

  return [...keys];
}

function buildUpstreamUrl(pathname: string): string {
  const base = resolveMarketingCdnUpstream();
  const candidates = objectKeyCandidates(pathname);
  const heroKey = resolveHeroR2ObjectKey(pathname);
  const objectKey = heroKey ?? candidates[0] ?? pathnameToObjectKey(pathname);
  return `${base}/${encodeObjectKey(objectKey)}`;
}

function buildUpstreamUrlCandidates(pathname: string): string[] {
  const base = resolveMarketingCdnUpstream();
  const urls = new Set<string>();
  for (const key of objectKeyCandidates(pathname)) {
    urls.add(`${base}/${encodeObjectKey(key)}`);
  }
  urls.add(`${base}${encodeObjectKey(pathnameToObjectKey(pathname))}`);
  return [...urls];
}

function cacheHeaders(): Record<string, string> {
  return {
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes"
  };
}

function toResponseBody(data: Buffer): Blob {
  return new Blob([Uint8Array.from(data)]);
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
    ...cacheHeaders(),
    "Content-Type": mime
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
  const localCandidates = [
    path.join(process.cwd(), "public", pathname.replace(/^\/+/u, "")),
    ...(resolveHeroR2ObjectKey(pathname)
      ? [path.join(process.cwd(), "public", resolveHeroR2ObjectKey(pathname)!)]
      : [])
  ];

  for (const localPath of localCandidates) {
    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(localPath);
      if (!stat.isFile()) continue;
    } catch {
      continue;
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
      return new Response(toResponseBody(body), {
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
      return new Response(toResponseBody(buffer), {
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

  return null;
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

  // Never buffer entire objects in serverless — only honour explicit byte ranges.
  if (!rangeHeader) {
    return null;
  }

  const parsed = parseByteRange(rangeHeader, total);
  if (parsed === "invalid" || parsed === "unsatisfiable") {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }

  const { start, end } = parsed;
  const body = await getObjectRange(key, parsed);
  if (!body) return null;

  return new Response(toResponseBody(body), {
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

  // Stream through R2 public CDN first — native Range support, no serverless body limits.
  if (method === "GET") {
    const streamed = await serveFromPublicCdn(pathname, rangeHeader, method);
    if (streamed.status !== 404) return streamed;
  }

  const fromR2 = await serveFromR2Storage(pathname, rangeHeader, method);
  if (fromR2) return fromR2;

  if (method !== "GET") {
    return serveFromPublicCdn(pathname, rangeHeader, method);
  }

  return new Response("Not Found", { status: 404 });
}
