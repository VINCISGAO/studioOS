import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminRouteRole, normalizeRouteRole } from "@/lib/auth/route-access";
import { applyAdminSecurityHeaders, generateAdminCspNonce } from "@/lib/auth/admin-security-headers";
import { applyBaselineSecurityHeaders } from "@/lib/auth/baseline-security-headers";
import { applyLoginSecurityHeaders } from "@/lib/auth/login-security-headers";
import { isHomepageLangPath, isInternalAppPath, normalizeAppLanguage } from "@/lib/app-language.shared";
import { demoRedirectForRole } from "@/lib/demo-auth";
import { DEMO_SESSION_COOKIE, ADMIN_SESSION_COOKIE, LOCALE_COOKIE } from "@/lib/auth-config";
import { parseDemoSessionCookieAsync } from "@/lib/demo-session-cookie";
import { toSafeNextPath, toSafeNextPathname } from "@/lib/auth/post-login-redirect";

function persistLanguageCookie(response: NextResponse, language: string) {
  response.cookies.set(LOCALE_COOKIE, normalizeAppLanguage(language), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax"
  });
}

function redirectToPath(
  request: NextRequest,
  pathname: string,
  params?: Record<string, string | undefined>
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }
  return NextResponse.redirect(url);
}

/** Next.js RSC / Server Action / prefetch — must not receive HTML redirects. */
function isNextInternalNavigationRequest(request: NextRequest) {
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("Next-Action") !== null ||
    request.nextUrl.searchParams.has("_rsc")
  );
}

function isAuthMutationPath(pathname: string) {
  if (pathname.startsWith("/api/auth/oauth/") || pathname.startsWith("/api/admin/auth/")) {
    return false;
  }
  return (
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/register" ||
    pathname === "/api/login" ||
    pathname === "/api/continue" ||
    pathname === "/api/user/create" ||
    pathname.startsWith("/api/account/")
  );
}

function isClearlyMaliciousUserAgent(userAgent: string) {
  const value = userAgent.toLowerCase();
  return (
    value.includes("sqlmap") ||
    value.includes("nikto") ||
    value.includes("masscan") ||
    value.includes("nmap") ||
    value.includes("acunetix")
  );
}

function resolveAllowedOrigins(request: NextRequest): Set<string> {
  const allowed = new Set<string>();
  allowed.add(request.nextUrl.origin);

  const host = request.headers.get("host")?.split(",")[0]?.trim();
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost) {
    allowed.add(`${forwardedProto}://${forwardedHost}`);
  }

  for (const raw of [
    process.env.VINCIS_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    "https://vincis.app"
  ]) {
    const value = raw?.trim();
    if (!value) continue;
    allowed.add(value.startsWith("http") ? value.replace(/\/+$/u, "") : `https://${value}`);
  }

  return allowed;
}

function enforceAuthEdgeRules(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  if (!isAuthMutationPath(pathname)) return null;

  const userAgent = request.headers.get("user-agent") ?? "";
  if (isClearlyMaliciousUserAgent(userAgent)) {
    return NextResponse.json({ ok: false, error: "安全验证失败，请稍后重试。" }, { status: 403 });
  }

  if (request.method === "GET") {
    return NextResponse.json({ ok: false, error: "安全验证失败，请稍后重试。" }, { status: 405 });
  }

  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (origin) {
      const allowedOrigins = resolveAllowedOrigins(request);
      if (!allowedOrigins.has(origin)) {
        return NextResponse.json({ ok: false, error: "安全验证失败，请稍后重试。" }, { status: 403 });
      }
    }
  }

  return null;
}

/** Rewrite broken links like ?lang%3Dzh=&lang=zh → ?lang=zh (preserve role/next/etc.) */
function sanitizeBrokenLocaleSearch(request: NextRequest): NextResponse | null {
  const rawSearch = request.nextUrl.search;
  if (!rawSearch.includes("lang%3D") && !rawSearch.includes("lang%253D")) {
    return null;
  }

  const url = request.nextUrl.clone();
  const params = new URLSearchParams(url.search);
  for (const key of [...params.keys()]) {
    if (key.includes("lang%3D") || key.includes("lang%253D")) {
      params.delete(key);
    }
  }

  const existingLang = params.get("lang");
  if (!existingLang || existingLang.includes("%")) {
    params.set("lang", rawSearch.includes("zh") ? "zh" : "en");
  }

  url.search = params.toString() ? `?${params.toString()}` : "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  const authEdgeResponse = enforceAuthEdgeRules(request);
  if (authEdgeResponse) {
    return authEdgeResponse;
  }

  if (!isApiRoute) {
    const sanitized = sanitizeBrokenLocaleSearch(request);
    if (sanitized && !isNextInternalNavigationRequest(request)) {
      return sanitized;
    }
  }

  // Fix broken links like /?lang%3Dzh → /?lang=zh
  const rawSearch = request.nextUrl.search;
  if (
    !isApiRoute &&
    !isNextInternalNavigationRequest(request) &&
    (rawSearch === "?lang%3Dzh" || rawSearch === "?lang%3Den")
  ) {
    const url = request.nextUrl.clone();
    url.search = rawSearch.includes("zh") ? "?lang=zh" : "?lang=en";
    return NextResponse.redirect(url);
  }

  const langParam = request.nextUrl.searchParams.get("lang");

  if (
    !isApiRoute &&
    !isNextInternalNavigationRequest(request) &&
    langParam &&
    pathname === "/login"
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    const response = NextResponse.redirect(url);
    persistLanguageCookie(response, langParam);
    return response;
  }

  if (
    !isApiRoute &&
    !isNextInternalNavigationRequest(request) &&
    langParam &&
    isInternalAppPath(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    const response = NextResponse.redirect(url);
    persistLanguageCookie(response, langParam);
    return response;
  }

  // Legacy creator order routes → unified /studio portal
  if (pathname.startsWith("/creator/orders/")) {
    const match = pathname.match(/^\/creator\/orders\/([^/]+)(?:\/review-upload)?\/?$/);
    if (match?.[1]) {
      const orderId = match[1];
      return redirectToPath(
        request,
        pathname.endsWith("/review-upload") ? `/studio/review/${orderId}` : `/studio/projects/${orderId}`
      );
    }
  }

  if (pathname === "/workspace/studio" || pathname.startsWith("/workspace/studio/")) {
    return redirectToPath(request, "/studio/projects");
  }

  if (pathname === "/workspace/brand" || pathname.startsWith("/workspace/brand/")) {
    return redirectToPath(request, "/brand");
  }

  if (pathname === "/workspace/projects/new") {
    const params = new URLSearchParams(request.nextUrl.search);
    params.delete("lang");
    const query = params.toString();
    const url = request.nextUrl.clone();
    url.pathname = "/brand/projects/new";
    url.search = query ? `?${query}` : "";
    return NextResponse.redirect(url);
  }

  if (
    pathname === "/brand/brief" ||
    pathname === "/brand/publish" ||
    pathname === "/brand/requirements/new"
  ) {
    return redirectToPath(request, "/brand/projects/new", { step: "1" });
  }

  function nextWithPathHeaders(extraHeaders?: Record<string, string>) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-search", request.nextUrl.searchParams.toString());
    if (extraHeaders) {
      for (const [key, value] of Object.entries(extraHeaders)) {
        requestHeaders.set(key, value);
      }
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const isAdminSurface =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/v1/admin/");
  const adminCspNonce = isAdminSurface ? generateAdminCspNonce() : undefined;
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  let response = nextWithPathHeaders(
    adminCspNonce ? { "x-admin-csp-nonce": adminCspNonce } : undefined
  );

  if (langParam && isHomepageLangPath(pathname)) {
    persistLanguageCookie(response, langParam);
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminLoginRoute = pathname === "/admin/login";
  const isAdminSetupRoute = pathname === "/admin/setup-totp";
  const isAdminPublicRoute = isAdminLoginRoute || isAdminSetupRoute;
  const isAdminRoute = pathname.startsWith("/admin") && !isAdminPublicRoute;
  const isAdminApiRoute = pathname.startsWith("/api/admin/");
  const isLegacyAdminApiRoute = pathname.startsWith("/api/v1/admin/");
  const isAdminAuthApiRoute = pathname.startsWith("/api/admin/auth/");
  const isAdminSetupApiRoute = pathname.startsWith("/api/admin/setup-totp");
  const isCreatorWorkspaceRoute =
    pathname === "/creator" ||
    pathname.startsWith("/creator/orders") ||
    pathname.startsWith("/creator/profile") ||
    pathname === "/studio" ||
    pathname.startsWith("/studio/");
  const isBrandWorkspaceRoute = pathname === "/brand" || pathname.startsWith("/brand/");
  const isProtectedRoute = isDashboardRoute || isAdminRoute || isCreatorWorkspaceRoute || isBrandWorkspaceRoute;

  function hasAdminSessionCookie(request: NextRequest) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    return Boolean(token && token.length >= 32);
  }

  if ((isAdminApiRoute || isLegacyAdminApiRoute) && !isAdminAuthApiRoute && !isAdminSetupApiRoute) {
    if (!hasAdminSessionCookie(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return applyAdminSecurityHeaders(response, { nonce: adminCspNonce, production: isProduction });
  }

  if (isAdminRoute) {
    if (!hasAdminSessionCookie(request)) {
      return redirectToAdminLogin(request);
    }
    return applyAdminSecurityHeaders(response, { nonce: adminCspNonce, production: isProduction });
  }

  if (isAdminPublicRoute || isAdminAuthApiRoute || isAdminSetupApiRoute) {
    return applyAdminSecurityHeaders(response, { nonce: adminCspNonce, production: isProduction });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabaseClient: ReturnType<typeof createServerClient> | null = null;

  async function resolveSupabaseUser() {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    if (!supabaseClient) {
      supabaseClient = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = nextWithPathHeaders(
              adminCspNonce ? { "x-admin-csp-nonce": adminCspNonce } : undefined
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          }
        }
      });
    }

    const {
      data: { user }
    } = await supabaseClient.auth.getUser();
    return user;
  }

  async function resolveSupabasePortalRole() {
    const supabaseUser = await resolveSupabaseUser();
    if (!supabaseUser || !supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const client =
      supabaseClient ??
      createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {}
        }
      });

    const [{ data: legacyProfile }, { data: mvpProfile }] = await Promise.all([
      client.from("users").select("role").eq("id", supabaseUser.id).maybeSingle(),
      client.from("profiles").select("role").eq("id", supabaseUser.id).maybeSingle()
    ]);

    const routeRole = normalizeRouteRole(
      legacyProfile?.role ?? mvpProfile?.role ?? supabaseUser.user_metadata?.role
    );

    if (routeRole === "creator" || routeRole === "client") {
      return routeRole;
    }

    return null;
  }

  if (pathname === "/login") {
    const safeNext = resolveSafeLoginNext(request);
    const demoSession = await parseDemoSessionCookieAsync(
      request.cookies.get(DEMO_SESSION_COOKIE)?.value
    );

    if (demoSession?.role === "client" || demoSession?.role === "creator") {
      return redirectToRoleDefault(request, demoSession.role, safeNext);
    }

    const portalRole = await resolveSupabasePortalRole();
    if (portalRole) {
      return redirectToRoleDefault(request, portalRole, safeNext);
    }

    return applyLoginSecurityHeaders(response);
  }

  if (!isProtectedRoute) {
    if (pathname.startsWith("/auth/")) {
      return applyLoginSecurityHeaders(response);
    }
    return applyBaselineSecurityHeaders(response);
  }

  const demoSession = await parseDemoSessionCookieAsync(
    request.cookies.get(DEMO_SESSION_COOKIE)?.value
  );

  function redirectToRoleHome(request: NextRequest, role: ReturnType<typeof normalizeRouteRole>) {
    return redirectToPath(request, demoRedirectForRole(role ?? "client"));
  }

  function authorizeDemoSession(response: NextResponse) {
    if (!demoSession) {
      return redirectToLogin(request);
    }

    if (isAdminRoute && !isAdminRouteRole(demoSession.role)) {
      return redirectToAdminLogin(request);
    }

    if (isCreatorWorkspaceRoute && demoSession.role !== "creator") {
      return redirectToRoleHome(request, normalizeRouteRole(demoSession.role));
    }

    if (isBrandWorkspaceRoute && demoSession.role !== "client") {
      return redirectToRoleHome(request, normalizeRouteRole(demoSession.role));
    }

    return response;
  }

  if (demoSession) {
    return authorizeDemoSession(response);
  }

  const supabaseUser = await resolveSupabaseUser();
  if (!supabaseUser) {
    return redirectToLogin(request);
  }

  const metadataRole = normalizeRouteRole(supabaseUser.user_metadata?.role);
  if (metadataRole && !isAdminRoute && (isCreatorWorkspaceRoute || isBrandWorkspaceRoute)) {
    if (isCreatorWorkspaceRoute && metadataRole !== "creator") {
      return redirectToRoleHome(request, metadataRole);
    }
    if (isBrandWorkspaceRoute && metadataRole !== "client") {
      return redirectToRoleHome(request, metadataRole);
    }
    return response;
  }

  if (isAdminRoute || isCreatorWorkspaceRoute || isBrandWorkspaceRoute) {
    const client =
      supabaseClient ??
      createServerClient(supabaseUrl!, supabaseAnonKey!, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {}
        }
      });

    const [{ data: legacyProfile }, { data: mvpProfile }] = await Promise.all([
      client.from("users").select("role").eq("id", supabaseUser.id).maybeSingle(),
      client.from("profiles").select("role").eq("id", supabaseUser.id).maybeSingle()
    ]);

    const routeRole = normalizeRouteRole(
      legacyProfile?.role ?? mvpProfile?.role ?? supabaseUser.user_metadata?.role
    );

    if (isAdminRoute && !isAdminRouteRole(routeRole)) {
      return redirectToAdminLogin(request);
    }

    if (isCreatorWorkspaceRoute && routeRole !== "creator" && !isAdminRouteRole(routeRole)) {
      return redirectToRoleHome(request, routeRole);
    }

    if (isBrandWorkspaceRoute && routeRole !== "client" && !isAdminRouteRole(routeRole)) {
      return redirectToRoleHome(request, routeRole);
    }
  }

  return response;
}

function redirectToSafeRelativePath(request: NextRequest, safePath: string) {
  const url = request.nextUrl.clone();
  const hashIndex = safePath.indexOf("#");
  const hash = hashIndex >= 0 ? safePath.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? safePath.slice(0, hashIndex) : safePath;
  const [pathname, search = ""] = withoutHash.split("?");
  url.pathname = pathname || "/";
  url.search = search ? `?${search}` : "";
  if (hash) {
    url.hash = hash;
  }
  return NextResponse.redirect(url);
}

function resolveSafeLoginNext(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("next");
  if (!raw) return "";
  return toSafeNextPath(raw) || toSafeNextPathname(raw);
}

function redirectToRoleDefault(request: NextRequest, role: "client" | "creator", safeNext?: string) {
  if (safeNext) {
    return redirectToSafeRelativePath(request, safeNext);
  }
  return redirectToPath(request, demoRedirectForRole(role));
}

function redirectToAdminLogin(request: NextRequest) {
  const nextPath = toSafeNextPathname(request.nextUrl.pathname);
  return redirectToPath(request, "/admin/login", nextPath ? { next: nextPath } : undefined);
}

function redirectToLogin(request: NextRequest, error?: string) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return redirectToAdminLogin(request);
  }

  const pathWithSearch = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const nextPath = toSafeNextPath(pathWithSearch) || toSafeNextPathname(request.nextUrl.pathname);
  return redirectToPath(request, "/login", {
    ...(nextPath ? { next: nextPath } : {}),
    ...(error ? { error } : {})
  });
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/admin/:path*",
    "/api/v1/admin/:path*",
    "/api/register",
    "/api/login",
    "/api/continue",
    "/api/user/create",
    "/api/account/:path*",
    "/((?!_next/static|_next/image|favicon.ico|api/|videos/|images/|demo/).*)"
  ]
};
