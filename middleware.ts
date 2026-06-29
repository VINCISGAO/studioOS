import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEMO_SESSION_COOKIE, LOCALE_COOKIE } from "@/lib/auth-config";
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  // Fix broken links like /?lang%3Dzh → /?lang=zh
  const rawSearch = request.nextUrl.search;
  if (!isApiRoute && (rawSearch === "?lang%3Dzh" || rawSearch === "?lang%3Den")) {
    const url = request.nextUrl.clone();
    url.search = rawSearch.includes("zh") ? "?lang=zh" : "?lang=en";
    return NextResponse.redirect(url);
  }

  const langParam = request.nextUrl.searchParams.get("lang");
  const savedLang = request.cookies.get(LOCALE_COOKIE)?.value;

  if (!isApiRoute && !langParam && (savedLang === "zh" || savedLang === "en")) {
    const url = request.nextUrl.clone();
    url.searchParams.set("lang", savedLang);
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
    url.pathname = "/studio/review";
    return NextResponse.redirect(url);
  }

  function nextWithPathHeaders() {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-search", request.nextUrl.searchParams.toString());
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = nextWithPathHeaders();

  if (langParam === "zh" || langParam === "en") {
    response.cookies.set(LOCALE_COOKIE, langParam, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax"
    });
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isCreatorWorkspaceRoute =
    pathname === "/creator" ||
    pathname.startsWith("/creator/orders") ||
    pathname.startsWith("/creator/profile");
  const isProtectedRoute = isDashboardRoute || isAdminRoute || isCreatorWorkspaceRoute;

  if (!isProtectedRoute) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedRoute) {
      const demoSession = parseDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value);

      if (!demoSession) {
        return redirectToLogin(request);
      }

      if (isAdminRoute && demoSession.role !== "admin") {
        const url = withLang(request.nextUrl.clone(), request);
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      if (isCreatorWorkspaceRoute && !["creator", "admin"].includes(demoSession.role)) {
        const url = withLang(request.nextUrl.clone(), request);
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    return response;
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
    return redirectToLogin(request);
  }

  if ((isAdminRoute || isCreatorWorkspaceRoute) && user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (isAdminRoute && profile?.role !== "admin") {
      const url = withLang(request.nextUrl.clone(), request);
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (isCreatorWorkspaceRoute && !["creator", "admin"].includes(profile?.role ?? "")) {
      const url = withLang(request.nextUrl.clone(), request);
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

function redirectToLogin(request: NextRequest, error?: string) {
  const url = withLang(request.nextUrl.clone(), request);
  url.pathname = "/login";
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (error) {
    url.searchParams.set("error", error);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|videos/|images/).*)"]
};
