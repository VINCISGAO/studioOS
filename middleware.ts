import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { preferDemoAuth } from "@/lib/runtime-flags";
import { isAdminRouteRole, normalizeRouteRole } from "@/lib/auth/route-access";
import { applyAdminSecurityHeaders, generateAdminCspNonce } from "@/lib/auth/admin-security-headers";
import { applyBaselineSecurityHeaders } from "@/lib/auth/baseline-security-headers";
import { applyLoginSecurityHeaders } from "@/lib/auth/login-security-headers";
import { normalizeLanguageCode } from "@/features/i18n/language.constants";
import { demoRedirectForRole } from "@/lib/demo-auth";
import { DEMO_SESSION_COOKIE, ADMIN_SESSION_COOKIE, LOCALE_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-session";

function resolveLang(request: NextRequest) {
  const fromUrl = request.nextUrl.searchParams.get("lang");
  if (fromUrl === "zh" || fromUrl === "en") {
    return fromUrl;
  }

  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (fromCookie === "zh" || fromCookie === "en") {
    return fromCookie;
  }

  return "en";
}

function withLang(url: URL, request: NextRequest) {
  url.searchParams.set("lang", resolveLang(request));
  return url;
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
    !value ||
    value.includes("sqlmap") ||
    value.includes("nikto") ||
    value.includes("masscan") ||
    value.includes("nmap") ||
    value.includes("acunetix")
  );
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
    const referer = request.headers.get("referer");
    const expectedOrigin = request.nextUrl.origin;
    const validOrigin = !origin || origin === expectedOrigin;
    const validReferer = !referer || referer.startsWith(expectedOrigin);
    if (!validOrigin || !validReferer) {
      return NextResponse.json({ ok: false, error: "安全验证失败，请稍后重试。" }, { status: 403 });
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
  const savedLang = request.cookies.get(LOCALE_COOKIE)?.value;

  if (!isApiRoute && !langParam && !isNextInternalNavigationRequest(request) && savedLang) {
    const url = request.nextUrl.clone();
    url.searchParams.set("lang", normalizeLanguageCode(savedLang));
    return NextResponse.redirect(url);
  }

  // Legacy creator order routes → unified /studio portal
  if (pathname.startsWith("/creator/orders/")) {
    const match = pathname.match(/^\/creator\/orders\/([^/]+)(?:\/review-upload)?\/?$/);
    if (match?.[1]) {
      const orderId = match[1];
      const target = pathname.endsWith("/review-upload")
        ? `/studio/review/${orderId}`
        : `/studio/projects/${orderId}`;
      const url = withLang(request.nextUrl.clone(), request);
      url.pathname = target;
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/workspace/studio" || pathname.startsWith("/workspace/studio/")) {
    const url = withLang(request.nextUrl.clone(), request);
    url.pathname = "/studio/projects";
    return NextResponse.redirect(url);
  }

  if (pathname === "/workspace/brand" || pathname.startsWith("/workspace/brand/")) {
    const url = withLang(request.nextUrl.clone(), request);
    url.pathname = "/brand";
    return NextResponse.redirect(url);
  }

  if (pathname === "/workspace/projects/new") {
    const url = withLang(request.nextUrl.clone(), request);
    url.pathname = "/brand/projects/new";
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
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

  if (langParam) {
    response.cookies.set(LOCALE_COOKIE, normalizeLanguageCode(langParam), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
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

  if (!isProtectedRoute) {
    if (pathname === "/login" || pathname.startsWith("/auth/")) {
      return applyLoginSecurityHeaders(response);
    }
    return applyBaselineSecurityHeaders(response);
  }

  function redirectToRoleHome(request: NextRequest, role: ReturnType<typeof normalizeRouteRole>) {
    const url = withLang(request.nextUrl.clone(), request);
    url.pathname = demoRedirectForRole(role ?? "client");
    return NextResponse.redirect(url);
  }

  function authorizeDemoSession(request: NextRequest, response: NextResponse) {
    const demoSession = parseDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
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

  const demoSession = parseDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value);

  if (demoSession?.email.endsWith("@studioos.test")) {
    return authorizeDemoSession(request, response);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const useDemoSessionAuth = Boolean(demoSession) && (preferDemoAuth() || !supabaseUrl || !supabaseAnonKey);

  if (useDemoSessionAuth) {
    return authorizeDemoSession(request, response);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return authorizeDemoSession(request, response);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = nextWithPathHeaders();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    if (demoSession) {
      return authorizeDemoSession(request, response);
    }
    if (isAdminRoute) {
      return redirectToAdminLogin(request);
    }
    return redirectToLogin(request);
  }

  if ((isAdminRoute || isCreatorWorkspaceRoute || isBrandWorkspaceRoute) && user) {
    const [{ data: legacyProfile }, { data: mvpProfile }] = await Promise.all([
      supabase.from("users").select("role").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    ]);

    const routeRole = normalizeRouteRole(
      legacyProfile?.role ?? mvpProfile?.role ?? user.user_metadata?.role
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

function redirectToAdminLogin(request: NextRequest) {
  const url = withLang(request.nextUrl.clone(), request);
  url.pathname = "/admin/login";
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  url.searchParams.set("lang", resolveLang(request));
  const response = NextResponse.redirect(url);
  return response;
}

function redirectToLogin(request: NextRequest, error?: string) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return redirectToAdminLogin(request);
  }

  const url = withLang(request.nextUrl.clone(), request);
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (error) {
    url.searchParams.set("error", error);
  }
  url.searchParams.set("lang", resolveLang(request));
  return NextResponse.redirect(url);
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
    "/((?!_next/static|_next/image|favicon.ico|api/|videos/|images/).*)"
  ]
};
