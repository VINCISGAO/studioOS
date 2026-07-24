import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { appError } from "@/lib/core/errors";

const MAX_VIDEO_DOWNLOAD_BYTES = 200 * 1024 * 1024;

function isBlockedIpv4(hostname: string) {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isBlockedIpv6(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80:")) return true;
  return false;
}

function isBlockedHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized) return true;
  if (normalized === "localhost" || normalized.endsWith(".localhost")) return true;
  if (normalized.endsWith(".local") || normalized.endsWith(".internal")) return true;

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) return isBlockedIpv4(normalized);
  if (ipVersion === 6) return isBlockedIpv6(normalized);
  return false;
}

export async function assertSafeOutboundHttpsUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw appError("VALIDATION_ERROR", "Outbound URL is invalid");
  }

  if (parsed.protocol !== "https:") {
    throw appError("VALIDATION_ERROR", "Outbound URL must use HTTPS");
  }

  if (parsed.username || parsed.password) {
    throw appError("VALIDATION_ERROR", "Outbound URL must not include credentials");
  }

  const hostname = parsed.hostname;
  if (isBlockedHostname(hostname)) {
    throw appError("FORBIDDEN", "Outbound URL host is not allowed");
  }

  if (!isIP(hostname)) {
    const records = await lookup(hostname, { all: true, verbatim: true });
    if (!records.length) {
      throw appError("FORBIDDEN", "Outbound URL host could not be resolved");
    }
    for (const record of records) {
      if (isBlockedHostname(record.address)) {
        throw appError("FORBIDDEN", "Outbound URL resolves to a blocked address");
      }
    }
  }
}

export async function fetchHttpsWithByteLimit(
  url: string,
  maxBytes: number = MAX_VIDEO_DOWNLOAD_BYTES
) {
  await assertSafeOutboundHttpsUrl(url);

  const response = await fetch(url, { redirect: "manual" });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) {
      throw appError("SYSTEM_ERROR", "Outbound redirect missing location");
    }
    return fetchHttpsWithByteLimit(new URL(location, url).toString(), maxBytes);
  }

  if (!response.ok) {
    throw appError("SYSTEM_ERROR", `Outbound download failed (${response.status})`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw appError("VALIDATION_ERROR", "Downloaded file exceeds the allowed size");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw appError("SYSTEM_ERROR", "Outbound download response had no body");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw appError("VALIDATION_ERROR", "Downloaded file exceeds the allowed size");
    }
    chunks.push(value);
  }

  return {
    buffer: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))),
    contentType: response.headers.get("content-type")
  };
}
