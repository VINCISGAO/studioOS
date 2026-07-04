import "server-only";

import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/auth-config";
import type { AdminProfileWithUser } from "@/features/admin/auth/admin-profile.repository";
import { adminSessionRepository } from "@/features/admin/auth/admin-session.repository";
import { setAdminCsrfCookie, clearAdminCsrfCookie } from "@/lib/auth/admin-csrf";

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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

export function setAdminSessionCookieOnResponse(response: Response, token: string) {
  const secure = process.env.NODE_ENV === "production";
  response.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_SESSION_MAX_AGE_SEC}${secure ? "; Secure" : ""}`
  );
}

export async function revokeAdminSessionToken(token: string | null | undefined) {
  if (!token) return;
  await adminSessionRepository.revokeByToken(token);
}

export type ValidatedAdminSession = AdminProfileWithUser;
