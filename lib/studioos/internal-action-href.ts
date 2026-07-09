import type { Locale } from "@/lib/i18n";

const internalAppPathPrefixes = [
  "/brand",
  "/studio",
  "/admin",
  "/login",
  "/auth",
  "/creator",
  "/api",
  "/orders",
  "/proposal",
  "/dashboard",
  "/projects",
  "/workspace",
  "/match",
  "/creators",
  "/brands"
];
const appHostnames = new Set(["vincis.app", "www.vincis.app", "localhost", "127.0.0.1"]);
const fallbackOrigin = "https://vincis.app";

function isInternalAppPath(pathname: string) {
  return internalAppPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isKnownAppHost(hostname: string) {
  return appHostnames.has(hostname) || hostname.endsWith(".vercel.app");
}

function normalizeLegacyPath(pathname: string) {
  if (pathname === "/studio/delivery" || pathname === "/studio/upload") {
    return "/studio/projects";
  }
  if (pathname === "/workspace/studio" || pathname.startsWith("/workspace/studio/")) {
    return "/studio/projects";
  }
  if (pathname === "/workspace/brand" || pathname.startsWith("/workspace/brand/")) {
    return "/brand";
  }
  if (pathname === "/workspace/projects/new") {
    return "/brand/projects/new";
  }

  const creatorOrderReview = pathname.match(/^\/creator\/orders\/([^/]+)\/review-upload\/?$/);
  if (creatorOrderReview?.[1]) {
    return `/studio/review/${creatorOrderReview[1]}`;
  }
  const creatorOrder = pathname.match(/^\/creator\/orders\/([^/]+)\/?$/);
  if (creatorOrder?.[1]) {
    return `/studio/projects/${creatorOrder[1]}`;
  }

  return pathname;
}

export function normalizeInternalActionHref(href: string | null | undefined, locale: Locale, fallback = "/") {
  const raw = href?.trim();
  if (!raw) return fallback;

  try {
    const url = new URL(raw, fallbackOrigin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    if (!isKnownAppHost(url.hostname)) return fallback;
    url.pathname = normalizeLegacyPath(url.pathname);
    if (!isInternalAppPath(url.pathname)) return fallback;
    if (!url.searchParams.has("lang")) url.searchParams.set("lang", locale);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
