import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { DEMO_USERS } from "@/lib/demo-auth";
import { parseDemoSession } from "@/lib/demo-session";
import { createClient } from "@/lib/supabase/server";
import type { MvpProfile, MvpRole } from "@/lib/mvp/types";
import {
  DEMO_PROFILES,
  fileGetProfile,
  fileGetProfileByEmail
} from "@/lib/mvp/store-file";

function demoRoleToMvp(role: string): MvpRole {
  if (role === "admin") return "admin";
  if (role === "creator") return "studio";
  return "brand";
}

const DEMO_EMAIL_TO_PROFILE: Record<string, string> = {
  "client.arc@adbridge.test": DEMO_PROFILES.brand,
  "client.bright@adbridge.test": "prof_demo_brand_bright",
  "client.north@adbridge.test": "prof_demo_brand_bright",
  "creator.nova@adbridge.test": DEMO_PROFILES.studio,
  "creator.signal@adbridge.test": DEMO_PROFILES.studio,
  "creator.atlas@adbridge.test": DEMO_PROFILES.studio,
  "admin@adbridge.test": DEMO_PROFILES.admin
};

export async function getMvpProfile(): Promise<MvpProfile | null> {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      return {
        id: data.id,
        email: data.email,
        role: data.role as MvpRole,
        name: data.name ?? "",
        company_name: data.company_name ?? "",
        created_at: data.created_at
      };
    }

    return {
      id: user.id,
      email: user.email ?? "",
      role: demoRoleToMvp(String(user.user_metadata?.role ?? "brand")),
      name: String(user.user_metadata?.name ?? user.email?.split("@")[0] ?? ""),
      company_name: String(user.user_metadata?.company_name ?? ""),
      created_at: new Date().toISOString()
    };
  }

  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (!session) return null;

  const profileId = DEMO_EMAIL_TO_PROFILE[session.email.toLowerCase()];
  if (profileId) {
    try {
      return await fileGetProfile(profileId);
    } catch {
      return fallbackDemoProfile(session.email, profileId);
    }
  }

  const demoUser = DEMO_USERS.find((u) => u.email === session.email.toLowerCase());
  if (!demoUser) return null;

  return {
    id: createDemoProfileId(session.email),
    email: demoUser.email,
    role: demoRoleToMvp(demoUser.role),
    name: demoUser.label,
    company_name: demoUser.label,
    created_at: new Date().toISOString()
  };
}

function createDemoProfileId(email: string) {
  return `prof_${email.replace(/[^a-z0-9]/gi, "_")}`;
}

function fallbackDemoProfile(email: string, profileId: string): MvpProfile {
  const demoUser = DEMO_USERS.find((u) => u.email === email.toLowerCase());
  return {
    id: profileId,
    email: email.toLowerCase(),
    role: demoRoleToMvp(demoUser?.role ?? "client"),
    name: demoUser?.label ?? email.split("@")[0],
    company_name: demoUser?.label ?? "",
    created_at: new Date().toISOString()
  };
}

export async function requireMvpProfile(role?: MvpRole | MvpRole[]): Promise<MvpProfile> {
  const profile = await getMvpProfile();
  if (!profile) {
    throw new Error("UNAUTHORIZED");
  }
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(profile.role) && profile.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
  }
  return profile;
}

export { demoRoleToMvp, fileGetProfileByEmail };
