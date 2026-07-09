import { cookies } from "next/headers";
import { resolveBrandBriefEmailFromCookieValues } from "@/lib/brand-brief-session";
import { DEMO_SESSION_COOKIE, VISITOR_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { parseServerDemoSession } from "@/lib/demo-session-server";
import { getCurrentSession } from "@/lib/session-user";

export { brandDraftEmailForSession } from "@/lib/brand-brief-session";

export async function getCurrentClientEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = parseServerDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (session?.role === "client") {
    return session.email.toLowerCase();
  }

  const currentSession = await getCurrentSession();
  if (currentSession?.role === "client") {
    return currentSession.email.toLowerCase();
  }

  if (!hasSupabaseConfig()) {
    const visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
    if (visitorId) {
      return `${visitorId}@visitor.vincis.local`;
    }
  }

  return null;
}

/** Brand brief wizard — authenticated brand first, then guest visitor / draft fallback. */
export async function resolveBrandBriefClientEmail(): Promise<string | null> {
  const session = await getCurrentSession();
  if (session?.role === "client") {
    return session.email.toLowerCase();
  }

  const cookieStore = await cookies();
  return resolveBrandBriefEmailFromCookieValues(
    cookieStore.get(DEMO_SESSION_COOKIE)?.value,
    cookieStore.get(VISITOR_COOKIE)?.value
  );
}

/** Brand portal actions require an authenticated Brand, not a guest wizard draft. */
export async function requireBrandPortalClientEmail(): Promise<string> {
  const session = await getCurrentSession();
  if (!session || session.role !== "client") {
    throw new Error("Unauthorized");
  }
  return session.email.toLowerCase();
}

export async function getOrCreateVisitorId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE)?.value;
  if (existing) {
    return existing;
  }

  const visitorId = `vis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  cookieStore.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return visitorId;
}
