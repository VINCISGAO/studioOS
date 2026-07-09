import { readRequestMeta } from "@/lib/core/request-meta";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { preferDemoAuth } from "@/lib/can-persist-local-store";
import { setDemoSession } from "@/lib/demo-auth-server";
import {
  DEMO_PASSWORD,
  DEMO_USERS,
  type DemoUser
} from "@/lib/demo-auth";
import type { DemoSession } from "@/lib/demo-session";
import { hashPassword } from "@/lib/core/password";
import { authService } from "@/features/auth/auth.service";
import { buildSessionPayload } from "@/features/auth/session.service";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-redirect";
import { appPath } from "@/lib/i18n";
import { userRepository } from "@/features/auth/user.repository";
import type { UserRole } from "@prisma/client";
import { getCreatorIdForDemoEmail } from "@/lib/creator-session";
import {
  authenticateDemoCreatorEmail,
  getStoredCreatorSettings,
  recordCreatorLogin
} from "@/lib/studioos/creator-settings-service";
import { creators } from "@/lib/data";
import { getCreatorById } from "@/lib/creator-service";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdminUserRole } from "@/lib/auth/platform-admin-guard";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export type SignInInput = {
  email: string;
  password: string;
  lang: Locale;
  expectedRole: "brand" | "creator" | "admin" | "";
  nextPath?: string;
};

export type SignInSuccess = { ok: true; redirectTo: string; session: DemoSession };
export type SignInFailure = {
  ok: false;
  error: string;
  errorCode?: "wrong-role" | "invalid-credentials" | "unsupported-provider" | "admin-required";
  role?: string;
  email?: string;
};
export type SignInResult = SignInSuccess | SignInFailure;

function demoRoleToPrisma(role: DemoUser["role"]): UserRole {
  if (role === "admin") return "ADMIN";
  if (role === "creator") return "CREATOR";
  return "BRAND";
}

function hasBrandAccess(user: { role: UserRole; hasBrandProfile?: boolean }) {
  return user.role === "BRAND" || Boolean(user.hasBrandProfile);
}

function hasCreatorAccess(user: { role: UserRole; hasCreatorProfile?: boolean }) {
  return user.role === "CREATOR" || Boolean(user.hasCreatorProfile);
}

function sessionRoleForUser(
  user: { role: UserRole; hasBrandProfile?: boolean; hasCreatorProfile?: boolean },
  expectedRole: SignInInput["expectedRole"]
): DemoUser["role"] {
  if (expectedRole === "creator" && hasCreatorAccess(user)) return "creator";
  if (expectedRole === "brand" && hasBrandAccess(user)) return "client";
  return user.role === "CREATOR" ? "creator" : "client";
}

async function authenticateDemoLogin(email: string, password: string): Promise<DemoUser | null> {
  const normalized = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const direct = DEMO_USERS.find((user) => user.email === normalized);

  if (direct) {
    const creatorId = getCreatorIdForDemoEmail(normalized);
    if (creatorId) {
      const seed = creators.find((creator) => creator.id === creatorId);
      if (seed) {
        const settings = await getStoredCreatorSettings(creatorId);
        if (settings?.account_deleted_at) {
          return null;
        }
        const expected = settings?.custom_password ?? direct.password;
        if (normalizedPassword !== expected) {
          return null;
        }
        return { ...direct, password: normalizedPassword };
      }
    }

    if (direct.password !== normalizedPassword) {
      return null;
    }
    return direct;
  }

  const aliasAuth = await authenticateDemoCreatorEmail(email, normalizedPassword);
  if (!aliasAuth) {
    return null;
  }

  return {
    email: aliasAuth.email,
    password,
    role: aliasAuth.role,
    label: aliasAuth.label
  };
}

export async function recordCreatorSignIn(email: string) {
  const { resolveCreatorIdByEmail } = await import("@/lib/studioos/creator-settings-service");
  const creatorId = await resolveCreatorIdByEmail(email);
  if (!creatorId) {
    return;
  }

  const creator = await getCreatorById(creatorId);
  if (!creator) {
    return;
  }

  const meta = await readRequestMeta();
  await recordCreatorLogin(creatorId, creator, {
    userAgent: meta.device ?? "Unknown",
    ip: meta.ip ?? "127.0.0.1"
  });
}

export async function performSignIn(input: SignInInput): Promise<SignInResult> {
  const { email, password, lang, expectedRole, nextPath = "" } = input;
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  const allowDemoFallback = preferDemoAuth();

  let prismaUser: Awaited<ReturnType<typeof authService.authenticate>> = null;
  try {
    prismaUser = await authService.authenticate(trimmedEmail, trimmedPassword);
  } catch {
    prismaUser = null;
  }

  if (prismaUser) {
    if (isPlatformAdminUserRole(prismaUser.role)) {
      return {
        ok: false,
        error: lang === "zh" ? "登录失败，请检查账号信息。" : "Sign-in failed. Check your account details.",
        errorCode: "invalid-credentials"
      };
    }

    const demoRole = sessionRoleForUser(prismaUser, expectedRole);

    if (expectedRole === "brand" && !hasBrandAccess(prismaUser)) {
      return {
        ok: false,
        error: lang === "zh" ? "该账号属于创作者身份，请切换到创作者登录。" : "This account is for creators. Switch to the creator tab.",
        errorCode: "wrong-role",
        role: "brand"
      };
    }

    if (expectedRole === "creator" && !hasCreatorAccess(prismaUser)) {
      return {
        ok: false,
        error: lang === "zh" ? "该账号属于广告主身份，请切换到广告主登录。" : "This account is for brands. Switch to the brand tab.",
        errorCode: "wrong-role",
        role: "creator"
      };
    }

    const session = buildSessionPayload(prismaUser, demoRole);
    await setDemoSession(session);
    if (demoRole === "creator") {
      await recordCreatorSignIn(prismaUser.email);
      if (prismaUser.role === "CREATOR" && hasDatabaseUrl()) {
        const { membershipService } = await import("@/features/membership/membership.service");
        await membershipService.ensureDefaultMembershipOnCreatorRegister(prismaUser.id).catch(() => null);
      }
    }

    const redirectTo = resolvePostLoginDestination({ role: demoRole }, nextPath, lang);

    return { ok: true, redirectTo, session };
  }

  const demoUser = allowDemoFallback
    ? await authenticateDemoLogin(trimmedEmail, trimmedPassword)
    : null;
  if (demoUser) {
    if (expectedRole === "brand" && demoUser.role !== "client") {
      return {
        ok: false,
        error: lang === "zh" ? "该账号属于创作者身份，请切换到创作者登录。" : "This account is for creators. Switch to the creator tab.",
        errorCode: "wrong-role",
        role: "brand"
      };
    }

    if (expectedRole === "creator" && demoUser.role !== "creator") {
      return {
        ok: false,
        error: lang === "zh" ? "该账号属于广告主身份，请切换到广告主登录。" : "This account is for brands. Switch to the brand tab.",
        errorCode: "wrong-role",
        role: "creator"
      };
    }

    const synced = hasDatabaseUrl()
      ? await userRepository
          .upsertDemoUser({
            email: demoUser.email.toLowerCase(),
            role: demoRoleToPrisma(demoUser.role),
            fullName: demoUser.label,
            passwordHash: hashPassword(DEMO_PASSWORD),
            companyName: demoUser.role === "client" ? demoUser.label : undefined,
            displayName: demoUser.role === "creator" ? demoUser.label : undefined
          })
          .catch(() => null)
      : null;

    const session = buildSessionPayload(
      {
        id: synced?.id ?? `demo_${demoUser.email.replace(/[^a-z0-9]/gi, "_")}`,
        email: demoUser.email,
        role: demoRoleToPrisma(demoUser.role),
        fullName: demoUser.label,
        languageCode: synced?.languageCode ?? synced?.language ?? "en",
        companyName: demoUser.role === "client" ? demoUser.label : undefined,
        displayName: demoUser.role === "creator" ? demoUser.label : undefined,
        hasBrandProfile: demoUser.role === "client",
        hasCreatorProfile: demoUser.role === "creator"
      },
      demoUser.role
    );

    await setDemoSession(session);
    if (demoUser.role === "creator") {
      await recordCreatorSignIn(demoUser.email);
    }

    const redirectTo = resolvePostLoginDestination({ role: demoUser.role }, nextPath, lang);

    return { ok: true, redirectTo, session };
  }

  if (!hasSupabaseConfig()) {
    const roleParam = expectedRole || "brand";
    return {
      ok: false,
      error: lang === "zh" ? "邮箱或密码错误" : "Invalid email or password",
      errorCode: "invalid-credentials",
      role: roleParam,
      email: trimmedEmail
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password: trimmedPassword
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
      errorCode: "invalid-credentials",
      role: expectedRole || "brand",
      email: trimmedEmail
    };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user?.email) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const roleRaw = profile?.role ?? user.user_metadata?.role ?? "brand";
    const demoRole =
      roleRaw === "studio" || roleRaw === "creator"
        ? "creator"
        : roleRaw === "admin"
          ? "admin"
          : "client";

    await setDemoSession({
      email: user.email,
      role: demoRole,
      userId: user.id
    });

    const session: DemoSession = {
      email: user.email,
      role: demoRole,
      userId: user.id
    };

    const redirectTo = resolvePostLoginDestination({ role: demoRole }, nextPath, lang);

    return { ok: true, redirectTo, session };
  }

  return { ok: true, redirectTo: appPath("/dashboard"), session: { email: trimmedEmail, role: "client" } };
}
