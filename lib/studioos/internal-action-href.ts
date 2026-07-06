import type { Locale } from "@/lib/i18n";

const internalAppPathPrefixes = ["/brand", "/studio", "/admin", "/login", "/auth", "/creator", "/api"];
const appHostnames = new Set(["vincis.app", "www.vincis.app", "localhost", "127.0.0.1"]);
const fallbackOrigin = "https://vincis.app";

function isInternalAppPath(pathname: string) {
  return internalAppPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isKnownAppHost(hostname: string) {
  return appHostnames.has(hostname) || hostname.endsWith(".vercel.app");
}

export function normalizeInternalActionHref(href: string | null | undefined, locale: Locale, fallback = "/") {
  const raw = href?.trim();
  if (!raw) return fallback;

  try {
    const url = new URL(raw, fallbackOrigin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    if (!isKnownAppHost(url.hostname) && raw.startsWith("http")) return url.toString();
    if (!isInternalAppPath(url.pathname)) return raw.startsWith("http") ? url.toString() : raw;
    if (!url.searchParams.has("lang")) url.searchParams.set("lang", locale);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
