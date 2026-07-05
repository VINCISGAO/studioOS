import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { assertAuthSecuritySecret } from "@/lib/auth/admin-security-config";
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE } from "@/lib/auth-config";

export function buildAdminCsrfToken(sessionToken: string) {
  return createHmac("sha256", assertAuthSecuritySecret())
    .update(`admin-csrf:${sessionToken}`)
    .digest("base64url");
}

export function adminCsrfCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec
  };
}

export async function setAdminCsrfCookie(sessionToken: string, maxAgeSec: number) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_CSRF_COOKIE, buildAdminCsrfToken(sessionToken), adminCsrfCookieOptions(maxAgeSec));
}

export async function clearAdminCsrfCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_CSRF_COOKIE);
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function validateAdminCsrf(request: Request) {
  const csrfHeader = request.headers.get("x-admin-csrf")?.trim() ?? "";
  return validateAdminCsrfValue(csrfHeader);
}

export async function validateAdminCsrfValue(csrfHeader: string) {
  const sessionToken = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const csrfCookie = (await cookies()).get(ADMIN_CSRF_COOKIE)?.value?.trim() ?? "";

  if (!sessionToken || !csrfHeader || !csrfCookie) return false;
  if (!safeEqual(csrfHeader, csrfCookie)) return false;

  const expected = buildAdminCsrfToken(sessionToken);
  return safeEqual(csrfHeader, expected);
}
