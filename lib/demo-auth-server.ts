import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import type { DemoSession } from "@/lib/demo-session";
import { serializeDemoSessionCookie } from "@/lib/demo-session-server";

export async function setDemoSession(session: DemoSession) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, serializeDemoSessionCookie(session), demoSessionCookieOptions());
}

export function attachDemoSessionCookie(response: NextResponse, session: DemoSession) {
  response.cookies.set(DEMO_SESSION_COOKIE, serializeDemoSessionCookie(session), demoSessionCookieOptions());
}

function demoSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  };
}

export async function clearDemoSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}
