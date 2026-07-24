import { demoRedirectForRole, type DemoRole } from "@/lib/demo-auth";
import { appPath } from "@/lib/i18n";

const CREATOR_ONBOARDING_PATH = "/creator/onboarding";
const BRAND_WIZARD_ENTRY_PATH = "/brand/projects/new";
const ALLOWED_WIZARD_NEXT_QUERY_KEYS = new Set(["project", "step"]);

function safeUserRole(role: DemoRole): DemoRole {
  return role === "creator" ? "creator" : "client";
}

export function isSafeInternalPostLoginPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

function sanitizePathname(pathname: string) {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed.startsWith("/admin") || trimmed === "/login") {
    return "";
  }
  return trimmed;
}

/** Login ?next= must be a same-origin relative pathname only. */
export function toSafeNextPathname(path: string) {
  if (!isSafeInternalPostLoginPath(path)) {
    return "";
  }

  const pathname = path.split("?")[0]?.split("#")[0]?.trim() ?? "";
  return sanitizePathname(pathname);
}

/** Preserve safe wizard query params for post-login deep links. */
export function toSafeNextPath(path: string) {
  if (!isSafeInternalPostLoginPath(path)) {
    return "";
  }

  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const [pathname, search = ""] = withoutHash.split("?");
  const safePathname = sanitizePathname(pathname);
  if (!safePathname) {
    return "";
  }

  if (safePathname !== BRAND_WIZARD_ENTRY_PATH) {
    return `${safePathname}${hash}`;
  }

  const params = new URLSearchParams(search);
  const safeParams = new URLSearchParams();
  for (const key of ALLOWED_WIZARD_NEXT_QUERY_KEYS) {
    const value = params.get(key)?.trim();
    if (value) {
      safeParams.set(key, value);
    }
  }

  const query = safeParams.toString();
  return `${safePathname}${query ? `?${query}` : ""}${hash}`;
}

export function resolvePostLoginDestination(
  session: { role: DemoRole },
  nextPath: string,
  _locale?: unknown
) {
  const role = safeUserRole(session.role);
  const safeNext = toSafeNextPath(nextPath) || toSafeNextPathname(nextPath);
  const safePathname = safeNext.split("?")[0]?.split("#")[0] ?? "";

  if (!safeNext || !safePathname) {
    return appPath(demoRedirectForRole(role));
  }

  const isBrandPath = safePathname.startsWith("/brand");
  const isStudioPath =
    safePathname.startsWith("/studio") ||
    safePathname.startsWith("/creator") ||
    safePathname.startsWith("/workspace/studio");

  if (isBrandPath && role !== "client") {
    return appPath(demoRedirectForRole(role));
  }

  if (isStudioPath && role === "client") {
    return appPath("/brand");
  }

  return appPath(safeNext);
}

/** Single source of truth for post-login redirects across OTP, OAuth, middleware, and SSR login. */
export function resolveSafePostLoginDestination(input: {
  session: { role: DemoRole };
  requestedPath?: string;
  locale?: unknown;
  /** When false, creators are routed to onboarding instead of studio. */
  creatorPortalReady?: boolean;
}) {
  const role = safeUserRole(input.session.role);
  if (role === "creator" && input.creatorPortalReady === false) {
    return appPath(CREATOR_ONBOARDING_PATH);
  }

  return resolvePostLoginDestination(
    { role },
    input.requestedPath ?? "",
    input.locale
  );
}
