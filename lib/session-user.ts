import { cache } from "react";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { type DemoRole, type DemoSession } from "@/lib/demo-session";
import { parseServerDemoSession } from "@/lib/demo-session-server";
import { getSessionUser } from "@/features/auth/session.service";
import { createClient } from "@/lib/supabase/server";

function resolveDemoRole(raw: unknown): DemoRole | null {
  if (raw === "creator" || raw === "studio") return "creator";
  if (raw === "client" || raw === "brand") return "client";
  return null;
}

async function getSupabaseSession(): Promise<DemoSession | null> {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = resolveDemoRole(profile?.role ?? user.user_metadata?.role);
  if (!role) {
    return null;
  }

  return {
    email: user.email,
    role,
    userId: user.id
  };
}

export const getCurrentSession = cache(async (): Promise<DemoSession | null> => {
  const cookieStore = await cookies();
  const demoSession = parseServerDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (demoSession) {
    return demoSession;
  }

  return getSupabaseSession();
});

export async function getCurrentUserEmail(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.email ?? null;
}

/** Prisma-backed user when DATABASE_URL + session cookie are configured */
export async function getCurrentAuthUser() {
  return getSessionUser();
}
