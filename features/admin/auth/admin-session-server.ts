import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/auth-config";
import type { AdminUser } from "@/features/admin/auth/admin-user.repository";
import { adminSessionRepository } from "@/features/admin/auth/admin-session.repository";
import { buildAdminCsrfToken, setAdminCsrfCookie, clearAdminCsrfCookie } from "@/lib/auth/admin-csrf";

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC
  });
  await setAdminCsrfCookie(token, ADMIN_SESSION_MAX_AGE_SEC);
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  await clearAdminCsrfCookie();
}

export async function readAdminSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC
  };
}

/** Attach session + CSRF cookies to a Route Handler response (fetch clients need Set-Cookie on the response). */
export function attachAdminSessionCookiesToResponse(response: NextResponse, token: string) {
  const options = adminSessionCookieOptions();
  response.cookies.set(ADMIN_SESSION_COOKIE, token, options);
  response.cookies.set(ADMIN_CSRF_COOKIE, buildAdminCsrfToken(token), options);
}

export function buildAdminLoginSuccessResponse(input: { redirectTo: string; sessionToken: string }) {
  const response = NextResponse.json({ ok: true as const, redirectTo: input.redirectTo });
  attachAdminSessionCookiesToResponse(response, input.sessionToken);
  return response;
}

export function setAdminSessionCookieOnResponse(response: Response, token: string) {
  const secure = process.env.NODE_ENV === "production";
  response.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_SESSION_MAX_AGE_SEC}${secure ? "; Secure" : ""}`
  );
}

export async function revokeAdminSessionToken(token: string | null | undefined) {
  if (!token) return;
  await adminSessionRepository.revokeByToken(token);
}

export type ValidatedAdminSession = AdminUser;
