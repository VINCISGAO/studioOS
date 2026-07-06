import { randomBytes } from "crypto";
import { parseServerDemoSession } from "@/lib/demo-session-server";

/** Stable guest brand identity for a signed-in non-brand session (no cookie writes). */
export function brandDraftEmailForSession(email: string, role: string) {
  const slug = email.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return `brand_draft_${role}_${slug}@visitor.vincis.local`;
}

/** Resolve brand brief owner from raw cookie values (safe in route handlers). */
export function resolveBrandBriefEmailFromCookieValues(
  demoSessionRaw?: string,
  visitorIdRaw?: string
): string | null {
  const session = parseServerDemoSession(demoSessionRaw);

  if (session?.role === "client") {
    return session.email.toLowerCase();
  }

  if (session && (session.role === "creator" || session.role === "admin")) {
    return brandDraftEmailForSession(session.email, session.role);
  }

  if (visitorIdRaw) {
    return `${visitorIdRaw}@visitor.vincis.local`;
  }

  return null;
}

export function resolveBrandBriefStartFromRequestCookies(
  demoSessionRaw?: string,
  visitorIdRaw?: string
): { email: string; visitorId?: string } {
  const existing = resolveBrandBriefEmailFromCookieValues(demoSessionRaw, visitorIdRaw);
  if (existing) {
    return { email: existing };
  }

  const visitorId = `vis_${Date.now()}_${randomBytes(4).toString("hex")}`;
  return { email: `${visitorId}@visitor.vincis.local`, visitorId };
}
