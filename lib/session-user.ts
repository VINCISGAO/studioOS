import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession, type DemoSession } from "@/lib/demo-auth";

export async function getCurrentSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  return parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.email ?? null;
}
