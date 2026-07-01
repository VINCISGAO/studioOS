import { readRequestMeta } from "@/lib/core/request-meta";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { preferDemoAuth } from "@/lib/can-persist-local-store";
import { setDemoSession } from "@/lib/demo-auth-server";
import {
  demoRedirectForRole,
  DEMO_PASSWORD,
  DEMO_USERS,
  type DemoUser
} from "@/lib/demo-auth";
import { hashPassword } from "@/lib/core/password";
import { authService } from "@/features/auth/auth.service";
import { buildSessionPayload } from "@/features/auth/session.service";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-redirect";
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
import { withLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";

export type SignInInput = {
  email: string;
  password: string;
  lang: Locale;
  expectedRole: "brand" | "creator" | "admin" | "";
  nextPath?: string;
};

export type SignInSuccess = { ok: true; redirectTo: string };
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
  const allowDemoFallback =
    preferDemoAuth() ||
    expectedRole === "admin" ||
    trimmedEmail.endsWith("@studioos.test");

  const prismaUser = await authService.authenticate(trimmedEmail, trimmedPassword);
  if (prismaUser) {
    const demoRole =
      prismaUser.role === "CREATOR" ? "creator" : prismaUser.role === "ADMIN" ? "admin" : "client";

    if (expectedRole === "admin" && demoRole !== "admin") {
      return {
        ok: false,
        error:
          lang === "zh" ? "该账号没有管理员权限。" : "This account does not have administrator access.",
        errorCode: "admin-required"
      };
    }

    if (expectedRole === "brand" && demoRole !== "client" && demoRole !== "admin") {
      return {
        ok: false,
        error: lang === "zh" ? "该账号属于创作者身份，请切换到创作者登录。" : "This account is for creators. Switch to the creator tab.",
        errorCode: "wrong-role",
        role: "brand"
      };
    }

    if (expectedRole === "creator" && demoRole !== "creator" && demoRole !== "admin") {
      return {
        ok: false,
        error: lang === "zh" ? "该账号属于广告主身份，请切换到广告主登录。" : "This account is for brands. Switch to the brand tab.",
        errorCode: "wrong-role",
        role: "creator"
      };
    }

    await setDemoSession(buildSessionPayload(prismaUser, demoRole));
    if (demoRole === "creator") {
      await recordCreatorSignIn(prismaUser.email);
      if (prismaUser.role === "CREATOR" && hasDatabaseUrl()) {
        const { membershipService } = await import("@/features/membership/membership.service");
        await membershipService.ensureDefaultMembershipOnCreatorRegister(prismaUser.id).catch(() => null);
      }
    }

    const redirectTo = resolvePostLoginDestination({ role: demoRole }, nextPath, lang);

    return { ok: true, redirectTo };
  }

  const demoUser = allowDemoFallback
    ? await authenticateDemoLogin(trimmedEmail, trimmedPassword)
    : null;
  if (demoUser) {
    if (expectedRole === "admin" && demoUser.role !== "admin") {
      return {
        ok: false,
        error:
          lang === "zh" ? "该账号没有管理员权限。" : "This account does not have administrator access.",
        errorCode: "admin-required"
      };
    }

    if (expectedRole === "brand" && demoUser.role !== "client" && demoUser.role !== "admin") {
      return {
        ok: false,
        error: lang === "zh" ? "该账号属于创作者身份，请切换到创作者登录。" : "This account is for creators. Switch to the creator tab.",
        errorCode: "wrong-role",
        role: "brand"
      };
    }

    if (expectedRole === "creator" && demoUser.role !== "creator" && demoUser.role !== "admin") {
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

    await setDemoSession(
      buildSessionPayload(
        {
          id: synced?.id ?? `demo_${demoUser.email.replace(/[^a-z0-9]/gi, "_")}`,
          email: demoUser.email,
          role: demoRoleToPrisma(demoUser.role),
          fullName: demoUser.label,
          companyName: demoUser.role === "client" ? demoUser.label : undefined,
          displayName: demoUser.role === "creator" ? demoUser.label : undefined
        },
        demoUser.role
      )
    );
    if (demoUser.role === "creator") {
      await recordCreatorSignIn(demoUser.email);
    }

    const redirectTo = resolvePostLoginDestination({ role: demoUser.role }, nextPath, lang);

    return { ok: true, redirectTo };
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
  const { data, error } = await supabase.auth.signInWithPassword({
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

    const redirectTo = resolvePostLoginDestination({ role: demoRole }, nextPath, lang);

    return { ok: true, redirectTo };
  }

  return { ok: true, redirectTo: `/dashboard?lang=${lang}` };
}
