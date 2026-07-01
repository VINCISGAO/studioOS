import { headers } from "next/headers";
import type { UserRole } from "@prisma/client";
import { buildSessionPayload } from "@/features/auth/session.service";
import { userRepository } from "@/features/auth/user.repository";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-redirect";
import { recordCreatorSignIn } from "@/lib/auth/sign-in-service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { demoRedirectForRole, type DemoRole } from "@/lib/demo-auth";
import { setDemoSession } from "@/lib/demo-auth-server";
import { withLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export type OAuthEntryRole = "brand" | "creator";

export function entryRoleToPrisma(role: OAuthEntryRole): UserRole {
  return role === "creator" ? "CREATOR" : "BRAND";
}

export function prismaRoleToDemoRole(role: UserRole): DemoRole {
  if (role === "CREATOR" || role === "STUDIO") {
    return "creator";
  }
  if (role === "ADMIN" || role === "SUPPORT" || role === "SYSTEM") {
    return "admin";
  }
  return "client";
}

function supabaseProfileRoleToDemoRole(roleRaw: string | null | undefined): DemoRole | null {
  if (roleRaw === "studio" || roleRaw === "creator") {
    return "creator";
  }
  if (roleRaw === "admin") {
    return "admin";
  }
  if (roleRaw === "brand" || roleRaw === "client") {
    return "client";
  }
  return null;
}

function resolveFullName(raw: string, email: string) {
  const trimmed = raw.trim();
  if (trimmed) {
    return trimmed;
  }
  return email.split("@")[0] ?? email;
}

async function upsertSupabaseProfile(input: {
  supabaseUserId: string;
  email: string;
  fullName: string;
  demoRole: DemoRole;
}) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const supabase = await createClient();
  const profileRole =
    input.demoRole === "creator" ? "studio" : input.demoRole === "admin" ? "admin" : "brand";

  await supabase.from("profiles").upsert({
    id: input.supabaseUserId,
    email: input.email.toLowerCase(),
    role: profileRole,
    full_name: input.fullName
  });
}

export async function completeOAuthSignIn(input: {
  email: string;
  fullName: string;
  supabaseUserId?: string;
  entryRole: OAuthEntryRole;
  lang: Locale;
  nextPath?: string;
}): Promise<{ redirectTo: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const nextPath = input.nextPath?.trim() ?? "";
  const fullName = resolveFullName(input.fullName, normalizedEmail);
  const headerList = await headers();
  const loginMeta = {
    ip:
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerList.get("x-real-ip") ??
      undefined,
    device: headerList.get("user-agent") ?? undefined
  };

  if (hasDatabaseUrl()) {
    const existing = await userRepository.findByEmail(normalizedEmail);
    const user =
      existing ??
      (await userRepository.createFromOAuth({
        email: normalizedEmail,
        role: entryRoleToPrisma(input.entryRole),
        fullName
      }));

    if (existing) {
      await userRepository.touchLogin(existing.id, loginMeta);
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      companyName: user.brandProfile?.companyName,
      displayName: user.creatorProfile?.displayName ?? undefined
    };
    const demoRole = prismaRoleToDemoRole(authUser.role);

    await setDemoSession(buildSessionPayload(authUser, demoRole));

    if (demoRole === "creator") {
      await recordCreatorSignIn(authUser.email);
      if (authUser.role === "CREATOR") {
        const { membershipService } = await import("@/features/membership/membership.service");
        await membershipService.ensureDefaultMembershipOnCreatorRegister(authUser.id).catch(() => null);
      }
    }

    if (input.supabaseUserId) {
      await upsertSupabaseProfile({
        supabaseUserId: input.supabaseUserId,
        email: normalizedEmail,
        fullName,
        demoRole
      });
    }

    return {
      redirectTo: resolvePostLoginDestination({ role: demoRole }, nextPath, input.lang)
    };
  }

  if (hasSupabaseConfig() && input.supabaseUserId) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", input.supabaseUserId)
      .maybeSingle();

    const storedDemoRole = supabaseProfileRoleToDemoRole(profile?.role);
    const demoRole =
      storedDemoRole ?? (input.entryRole === "creator" ? "creator" : "client");

    await upsertSupabaseProfile({
      supabaseUserId: input.supabaseUserId,
      email: normalizedEmail,
      fullName,
      demoRole: storedDemoRole ?? demoRole
    });

    await setDemoSession({
      email: normalizedEmail,
      role: demoRole,
      userId: input.supabaseUserId
    });

    if (demoRole === "creator") {
      await recordCreatorSignIn(normalizedEmail);
    }

    return {
      redirectTo: resolvePostLoginDestination({ role: demoRole }, nextPath, input.lang)
    };
  }

  const demoRole = input.entryRole === "creator" ? "creator" : "client";
  const authUser = {
    id: `oauth_${normalizedEmail.replace(/[^a-z0-9]/gi, "_")}`,
    email: normalizedEmail,
    role: entryRoleToPrisma(input.entryRole),
    fullName,
    companyName: demoRole === "client" ? fullName : undefined,
    displayName: demoRole === "creator" ? fullName : undefined
  };

  await setDemoSession(buildSessionPayload(authUser, demoRole));

  if (demoRole === "creator") {
    await recordCreatorSignIn(normalizedEmail);
  }

  return {
    redirectTo: resolvePostLoginDestination({ role: demoRole }, nextPath, input.lang)
  };
}

export function oauthFailureRedirect(
  message: string,
  entryRole: OAuthEntryRole,
  lang: Locale
) {
  return withLocale(`/login?error=${encodeURIComponent(message)}&role=${entryRole}`, lang);
}

export function oauthSuccessFallbackRedirect(demoRole: DemoRole, lang: Locale) {
  return withLocale(demoRedirectForRole(demoRole), lang);
}
