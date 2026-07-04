import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import type { DemoSession } from "@/lib/demo-session";

export async function setDemoSession(session: DemoSession) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, JSON.stringify(session), demoSessionCookieOptions());
}

export function attachDemoSessionCookie(response: NextResponse, session: DemoSession) {
  response.cookies.set(DEMO_SESSION_COOKIE, JSON.stringify(session), demoSessionCookieOptions());
}

function demoSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  };
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}
