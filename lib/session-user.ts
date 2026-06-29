import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession, type DemoSession } from "@/lib/demo-session";
import { getSessionUser } from "@/features/auth/session.service";

export async function getCurrentSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  return parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.email ?? null;
}

/** Prisma-backed user when DATABASE_URL + session cookie are configured */
export async function getCurrentAuthUser() {
  return getSessionUser();
}
