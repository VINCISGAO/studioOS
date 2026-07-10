import { headers } from "next/headers";
import type { UserRole } from "@prisma/client";
import {
  assertIdentityRoleOrThrow,
  portalEntryToUserRole
} from "@/features/auth/identity-role-policy";
import { buildSessionPayload } from "@/features/auth/session.service";
import { userRepository, type UserWithProfiles } from "@/features/auth/user.repository";
import { userOAuthRepository } from "@/features/auth/user-oauth.repository";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-redirect";
import { recordCreatorSignIn } from "@/lib/auth/sign-in-service";
import { isPlatformAdminUserRole } from "@/lib/auth/platform-admin-guard";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { demoRedirectForRole, type DemoRole } from "@/lib/demo-auth";
import { setDemoSession } from "@/lib/demo-auth-server";
import { withLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { DemoSession } from "@/lib/demo-session";

export type OAuthEntryRole = "brand" | "creator";

export type OAuthSignInResult = {
  redirectTo: string;
  demoSession: DemoSession;
};

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

function resolveOAuthSessionRole(
  role: DemoRole | null | undefined,
  entryRole: OAuthEntryRole
): DemoSession["role"] {
  if (role === "creator") {
    return "creator";
  }
  if (role === "client") {
    return "client";
  }
  return entryRole === "creator" ? "creator" : "client";
}

function resolveOAuthSessionRoleForUser(
  user: UserWithProfiles,
  entryRole: OAuthEntryRole
): DemoSession["role"] {
  const expectedRole = portalEntryToUserRole(entryRole);
  if (user.role !== expectedRole) {
    return user.role === "CREATOR" ? "creator" : "client";
  }
  return entryRole === "creator" ? "creator" : "client";
}

async function ensureEntryRoleProfile(
  user: UserWithProfiles,
  entryRole: OAuthEntryRole,
  fullName: string
): Promise<UserWithProfiles> {
  const expectedRole = portalEntryToUserRole(entryRole);
  if (user.role !== expectedRole) {
    return user;
  }

  if (entryRole === "brand" && !user.brandProfile) {
    return userRepository.ensureBrandProfileForUser({
      userId: user.id,
      companyName: fullName
    });
  }

  if (entryRole === "creator" && !user.creatorProfile) {
    const updated = await userRepository.ensureCreatorProfileForUser({
      userId: user.id,
      displayName: fullName
    });
    const { membershipService } = await import("@/features/membership/membership.service");
    await membershipService.ensureDefaultMembershipOnCreatorRegister(
      updated.id,
      updated.creatorProfile?.id
    );
    return updated;
  }

  return user;
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
  demoRole: DemoSession["role"];
}) {
  if (!hasSupabaseConfig()) {
    return;
  }

  const supabase = await createClient();
  const profileRole = input.demoRole === "creator" ? "studio" : "brand";

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
}): Promise<OAuthSignInResult> {
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
    if (existing && isPlatformAdminUserRole(existing.role)) {
      throw new Error("Platform admin accounts must use /admin/login");
    }

    if (existing) {
      assertIdentityRoleOrThrow(existing, entryRoleToPrisma(input.entryRole), input.lang);
    }

    let user =
      existing ??
      (await userRepository.createFromOAuth({
        email: normalizedEmail,
        role: entryRoleToPrisma(input.entryRole),
        fullName
      }));

    user = await ensureEntryRoleProfile(user, input.entryRole, fullName);

    if (existing) {
      await userRepository.touchLogin(user.id, loginMeta);
    }

    if (isPlatformAdminUserRole(user.role)) {
      throw new Error("Platform admin accounts must use /admin/login");
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      languageCode: user.languageCode ?? user.language ?? "en",
      companyName: user.brandProfile?.companyName,
      displayName: user.creatorProfile?.displayName ?? undefined,
      hasBrandProfile: user.role === "BRAND",
      hasCreatorProfile: user.role === "CREATOR"
    };
    const sessionRole = resolveOAuthSessionRoleForUser(user, input.entryRole);
    const demoSession = buildSessionPayload(authUser, sessionRole);

    await setDemoSession(demoSession);

    if (sessionRole === "creator") {
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
        demoRole: sessionRole
      });
    }

    return {
      redirectTo: resolvePostLoginDestination({ role: sessionRole }, nextPath, input.lang),
      demoSession
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
    const sessionRole = resolveOAuthSessionRole(storedDemoRole, input.entryRole);
    const demoSession: DemoSession = {
      email: normalizedEmail,
      role: sessionRole,
      userId: input.supabaseUserId
    };

    await upsertSupabaseProfile({
      supabaseUserId: input.supabaseUserId,
      email: normalizedEmail,
      fullName,
      demoRole: sessionRole
    });

    await setDemoSession(demoSession);

    if (sessionRole === "creator") {
      await recordCreatorSignIn(normalizedEmail);
    }

    return {
      redirectTo: resolvePostLoginDestination({ role: sessionRole }, nextPath, input.lang),
      demoSession
    };
  }

  const sessionRole = input.entryRole === "creator" ? "creator" : "client";
  const authUser = {
    id: `oauth_${normalizedEmail.replace(/[^a-z0-9]/gi, "_")}`,
    email: normalizedEmail,
    role: entryRoleToPrisma(input.entryRole),
    fullName,
    languageCode: "en",
    companyName: sessionRole === "client" ? fullName : undefined,
    displayName: sessionRole === "creator" ? fullName : undefined,
    hasBrandProfile: sessionRole === "client",
    hasCreatorProfile: sessionRole === "creator"
  };
  const demoSession = buildSessionPayload(authUser, sessionRole);

  await setDemoSession(demoSession);

  if (sessionRole === "creator") {
    await recordCreatorSignIn(normalizedEmail);
  }

  return {
    redirectTo: resolvePostLoginDestination({ role: sessionRole }, nextPath, input.lang),
    demoSession
  };
}

function alipaySyntheticEmail(providerUserId: string) {
  const safe = providerUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 48) || "user";
  return `alipay+${safe}@oauth.vincis.app`;
}

export async function completeAlipaySignIn(input: {
  providerUserId: string;
  nickName: string;
  email?: string;
  avatar?: string;
  entryRole: OAuthEntryRole;
  lang: Locale;
  nextPath?: string;
}): Promise<{ redirectTo: string; userId: string; email: string; demoSession: DemoSession }> {
  const nextPath = input.nextPath?.trim() ?? "";
  const fullName = input.nickName.trim() || `Alipay用户${input.providerUserId.slice(-4)}`;
  const headerList = await headers();
  const loginMeta = {
    ip:
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerList.get("x-real-ip") ??
      undefined,
    device: headerList.get("user-agent") ?? undefined
  };

  if (!hasDatabaseUrl()) {
    throw new Error("Database is required for Alipay sign-in");
  }

  const linked = await userOAuthRepository.findLinkedUser("alipay", input.providerUserId);
  let user =
    linked ??
    (input.email ? await userRepository.findByEmail(input.email) : null);

  if (user) {
    assertIdentityRoleOrThrow(user, entryRoleToPrisma(input.entryRole), input.lang);
  }

  if (!user) {
    const email = input.email?.toLowerCase() ?? alipaySyntheticEmail(input.providerUserId);
    user = await userOAuthRepository.createUserWithOAuth({
      provider: "alipay",
      providerUserId: input.providerUserId,
      email,
      role: entryRoleToPrisma(input.entryRole),
      fullName,
      avatarUrl: input.avatar
    });
  } else {
    if (!linked) {
      await userOAuthRepository.linkAccount({
        userId: user.id,
        provider: "alipay",
        providerUserId: input.providerUserId
      });
    }
    await userRepository.touchLogin(user.id, loginMeta);
  }

  if (input.avatar?.trim()) {
    await userRepository.updateAvatarIfEmpty(user.id, input.avatar.trim());
    if (!user.avatarUrl) {
      user = { ...user, avatarUrl: input.avatar.trim() };
    }
  }

  if (isPlatformAdminUserRole(user.role)) {
    throw new Error("Platform admin accounts must use /admin/login");
  }

  user = await ensureEntryRoleProfile(user, input.entryRole, fullName);

  const authUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    languageCode: user.languageCode ?? user.language ?? "en",
    companyName: user.brandProfile?.companyName,
    displayName: user.creatorProfile?.displayName ?? undefined,
    hasBrandProfile: user.role === "BRAND",
    hasCreatorProfile: user.role === "CREATOR"
  };
  const sessionRole = resolveOAuthSessionRoleForUser(user, input.entryRole);
  const demoSession = buildSessionPayload(authUser, sessionRole);

  await setDemoSession(demoSession);

  if (sessionRole === "creator") {
    await recordCreatorSignIn(authUser.email);
    if (authUser.role === "CREATOR") {
      const { membershipService } = await import("@/features/membership/membership.service");
      await membershipService.ensureDefaultMembershipOnCreatorRegister(authUser.id).catch(() => null);
    }
  }

  return {
    redirectTo: resolvePostLoginDestination({ role: sessionRole }, nextPath, input.lang),
    userId: user.id,
    email: user.email,
    demoSession
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
