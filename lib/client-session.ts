import { cookies } from "next/headers";
import { resolveBrandBriefEmailFromCookieValues } from "@/lib/brand-brief-session";
import { DEMO_SESSION_COOKIE, VISITOR_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { parseServerDemoSession } from "@/lib/demo-session-server";

export { brandDraftEmailForSession } from "@/lib/brand-brief-session";

export async function getCurrentClientEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = parseServerDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (session?.role === "client") {
    return session.email.toLowerCase();
  }

  if (!hasSupabaseConfig()) {
    const visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
    if (visitorId) {
      return `${visitorId}@visitor.studioos.local`;
    }
  }

  return null;
}

/** Brand brief wizard — reuse brand login, guest visitor, or draft when another role is signed in. */
export async function resolveBrandBriefClientEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return resolveBrandBriefEmailFromCookieValues(
    cookieStore.get(DEMO_SESSION_COOKIE)?.value,
    cookieStore.get(VISITOR_COOKIE)?.value
  );
}

/** Brand portal actions — same identity resolution as the campaign wizard page. */
export async function requireBrandPortalClientEmail(): Promise<string> {
  const email = (await resolveBrandBriefClientEmail()) ?? (await getCurrentClientEmail());
  if (!email) {
    throw new Error("Unauthorized");
  }
  return email.toLowerCase();
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
