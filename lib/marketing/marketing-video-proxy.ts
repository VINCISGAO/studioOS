import { promises as fs } from "node:fs";
import path from "node:path";
import { isObjectStorageConfigured } from "@/lib/core/config/video";
import {
  heroR2ObjectKeyCandidates,
  marketingCdnBaseUrl,
  resolveHeroLocalRelativePath,
  resolveHeroR2ObjectKey
} from "@/lib/marketing/home-hero-video-sources";
import {
  isRecentWorkAssetPath,
  isRecentWorkImagePath,
  isRecentWorkVideoPath,
  recentWorkBasenameAliases,
  recentWorkObjectKeyCandidates
} from "@/lib/marketing/recent-work-media";
import { getObjectMetadata, getObjectRange } from "@/lib/studioos/object-storage";

const PASSTHROUGH_HEADERS = [
  "accept-ranges",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified"
] as const;

const ALLOWED_PREFIXES = [
  "/videos/home/hero/",
  "/videos/home/recent-work/",
  "/videos/marketing/showcase/"
] as const;

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

function assetMimeType(pathname: string): string {
  if (/\.jpe?g$/iu.test(pathname)) return "image/jpeg";
  if (/\.webp$/iu.test(pathname)) return "image/webp";
  if (/\.png$/iu.test(pathname)) return "image/png";
  if (/\.mp4$/iu.test(pathname)) return "video/mp4";
  return "application/octet-stream";
}

function pathnameToObjectKey(pathname: string): string {
  return pathname
    .replace(/^\/+/u, "")
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

function objectKeyCandidates(pathname: string): string[] {
  if (isRecentWorkAssetPath(pathname)) {
    return recentWorkObjectKeyCandidates(pathname);
  }

  const keys = new Set<string>();
  for (const heroKey of heroR2ObjectKeyCandidates(pathname)) {
    keys.add(heroKey);
  }
  const mappedHero = resolveHeroR2ObjectKey(pathname);
  if (mappedHero) keys.add(mappedHero);
  keys.add(pathnameToObjectKey(pathname));
  return [...keys];
}

function resolveMarketingCdnUpstream(): string {
  return (marketingCdnBaseUrl() ?? DEFAULT_MARKETING_CDN).replace(/\/+$/u, "");
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
  urls.add(`${base}/${encodeObjectKey(pathnameToObjectKey(pathname))}`);
  return [...urls];
}

const PROBE_CHUNK_BYTES = 2 * 1024 * 1024;

function defaultProbeRange(total: number): string {
  const end = Math.min(total - 1, PROBE_CHUNK_BYTES - 1);
  return `bytes=0-${end}`;
}

async function resolveContentLength(pathname: string): Promise<number | null> {
  const fromR2 = await resolveR2Object(pathname);
  if (fromR2?.contentLength) return fromR2.contentLength;

  const head = await fetchPublicCdn(pathname, "HEAD", null);
  if (!head) return null;
  const total = Number(head.headers.get("content-length") ?? 0);
  return total > 0 ? total : null;
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

async function resolveLocalPublicVideoPath(pathname: string): Promise<string | null> {
  const relative = pathname.replace(/^\/+/u, "");
  const direct = path.join(process.cwd(), "public", relative);

  try {
    const stat = await fs.stat(direct);
    if (stat.isFile()) return direct;
  } catch {
    // Fall through to basename alias match.
  }

  const directory = path.dirname(direct);
  const baseName = path.basename(direct);
  try {
    const entries = await fs.readdir(directory);
    const aliasCandidates = [baseName, ...recentWorkBasenameAliases(baseName)];
    for (const candidate of aliasCandidates) {
      const match = entries.find((entry) => entry.toLowerCase() === candidate.toLowerCase());
      if (match) return path.join(directory, match);
    }
  } catch {
    return null;
  }

  return null;
}

async function readLocalPublicVideo(
  pathname: string,
  rangeHeader: string | null,
  method: string
): Promise<Response | null> {
  const relativeCandidates = [
    pathnameToObjectKey(pathname),
    pathname.replace(/^\/+/u, ""),
    ...(isRecentWorkAssetPath(pathname) ? recentWorkObjectKeyCandidates(pathname) : []),
    ...(resolveHeroLocalRelativePath(pathname) ? [resolveHeroLocalRelativePath(pathname)!] : []),
    ...(resolveHeroR2ObjectKey(pathname) ? [resolveHeroR2ObjectKey(pathname)!] : [])
  ];

  const localPaths = new Set<string>();
  for (const relative of relativeCandidates) {
    const resolved = await resolveLocalPublicVideoPath(`/${relative}`);
    if (resolved) localPaths.add(resolved);
  }

  for (const localPath of localPaths) {
    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(localPath);
      if (!stat.isFile()) continue;
    } catch {
      continue;
    }

    const total = stat.size;
    const mime = assetMimeType(pathname);
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
  const mime = contentType ?? assetMimeType(pathname);
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
    if (rangeHeader) {
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
      headers.set("content-type", assetMimeType(pathname));
    }
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (!headers.has("accept-ranges")) {
      headers.set("Accept-Ranges", "bytes");
    }

    const total = Number(headers.get("content-length") ?? 0);
    if (rangeHeader && total > 0) {
      return rangedHeadResponse(total, assetMimeType(pathname), rangeHeader, headers);
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
    headers.set("content-type", assetMimeType(pathname));
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
  try {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    if (!isMarketingHomeVideoPath(pathname)) {
      return new Response("Not Found", { status: 404 });
    }

    const rangeHeader = request.headers.get("range");
    let effectiveRange = rangeHeader;

    // Recent-work posters: local public → CDN (full image, no byte-range probe).
    if (isRecentWorkImagePath(pathname)) {
      const local = await readLocalPublicVideo(pathname, null, method);
      if (local) return local;

      if (method === "GET" || method === "HEAD") {
        const streamed = await serveFromPublicCdn(pathname, null, method);
        if (streamed.status !== 404) return streamed;
      }

      return new Response("Not Found", { status: 404 });
    }

    // Recent-work videos: full local file first (poster capture needs moov atom), then ranged CDN.
    if (isRecentWorkVideoPath(pathname)) {
      const localFull = await readLocalPublicVideo(pathname, null, method);
      if (localFull) return localFull;

      if (method === "GET" && !effectiveRange) {
        effectiveRange = "bytes=0-1048575";
      }

      const local = await readLocalPublicVideo(pathname, effectiveRange, method);
      if (local) return local;

      if (method === "GET" || method === "HEAD") {
        const streamed = await serveFromPublicCdn(pathname, effectiveRange ?? rangeHeader, method);
        if (streamed.status !== 404) return streamed;
      }

      return new Response("Not Found", { status: 404 });
    }

    // Browsers often omit Range on the first GET — stream a small initial chunk only.
    if (method === "GET" && !effectiveRange) {
      const total = await resolveContentLength(pathname);
      if (total) {
        effectiveRange = defaultProbeRange(total);
      }
    }

    const local = await readLocalPublicVideo(pathname, effectiveRange, method);
    if (local) return local;

    if (method === "GET" || method === "HEAD") {
      const streamed = await serveFromPublicCdn(pathname, effectiveRange ?? rangeHeader, method);
      if (streamed.status !== 404) return streamed;
    }

    const fromR2 = await serveFromR2Storage(pathname, effectiveRange, method);
    if (fromR2) return fromR2;

    if (method === "HEAD") {
      return new Response("Not Found", { status: 404 });
    }

    return new Response("Not Found", { status: 404 });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
}
