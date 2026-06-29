"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { setDemoSession } from "@/lib/demo-auth-server";
import { parseDemoSession } from "@/lib/demo-auth";
import { getCurrentCreatorId } from "@/lib/creator-session";
import { getCreatorById } from "@/lib/creator-service";
import type { Locale } from "@/lib/i18n";
import type { OAuthProvider } from "@/lib/studioos/creator-settings-types";
import {
  revokeCreatorDevice,
  toggleCreatorOAuth,
  toggleCreatorTwoFactor,
  updateCreatorContactEmail,
  updateCreatorLoginEmail,
  updateCreatorPassword,
  updateCreatorPhone,
  updateCreatorSecurityPrefs
} from "@/lib/studioos/creator-settings-service";

function revalidateSettingsPaths() {
  revalidatePath("/studio/settings");
  revalidatePath("/studio/profile");
  revalidatePath("/match");
}

async function requireCreatorContext(lang: Locale) {
  const creatorId = await getCurrentCreatorId();
  if (!creatorId) {
    return { ok: false as const, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }

  const creator = await getCreatorById(creatorId);
  if (!creator) {
    return { ok: false as const, error: lang === "zh" ? "Studio 不存在" : "Studio not found" };
  }

  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  return {
    ok: true as const,
    creatorId,
    creator,
    sessionEmail: session?.email ?? creator.email
  };
}

export async function updateLoginEmailAction(input: { lang: Locale; email: string }) {
  const ctx = await requireCreatorContext(input.lang);
  if (!ctx.ok) {
    return ctx;
  }

  const result = await updateCreatorLoginEmail(
    ctx.creatorId,
    ctx.creator,
    input.email,
    ctx.sessionEmail
  );

  if (!result.ok) {
    return {
      ok: false as const,
      error:
        result.error === "email-taken"
          ? input.lang === "zh"
            ? "该邮箱已被使用"
            : "Email is already in use"
          : input.lang === "zh"
            ? "邮箱格式无效"
            : "Invalid email address"
    };
  }

  await setDemoSession({ email: result.email, role: "creator" });
  revalidateSettingsPaths();
  return { ok: true as const, email: result.email };
}

export async function updateContactEmailAction(input: { lang: Locale; email: string }) {
  const ctx = await requireCreatorContext(input.lang);
  if (!ctx.ok) {
    return ctx;
  }

  const result = await updateCreatorContactEmail(ctx.creatorId, ctx.creator, input.email);
  if (!result.ok) {
    return {
      ok: false as const,
      error: input.lang === "zh" ? "邮箱格式无效" : "Invalid email address"
    };
  }

  revalidateSettingsPaths();
  return { ok: true as const };
}

export async function updatePhoneAction(input: { lang: Locale; phone: string }) {
  const ctx = await requireCreatorContext(input.lang);
  if (!ctx.ok) {
    return ctx;
  }

  const result = await updateCreatorPhone(ctx.creatorId, ctx.creator, input.phone);
  if (!result.ok) {
    return {
      ok: false as const,
      error: input.lang === "zh" ? "请输入有效手机号" : "Enter a valid phone number"
    };
  }

  revalidateSettingsPaths();
  return { ok: true as const };
}

export async function updatePasswordAction(input: {
  lang: Locale;
  currentPassword: string;
  nextPassword: string;
}) {
  const ctx = await requireCreatorContext(input.lang);
  if (!ctx.ok) {
    return ctx;
  }

  const result = await updateCreatorPassword(
    ctx.creatorId,
    ctx.creator,
    input.currentPassword,
    input.nextPassword
  );

  if (!result.ok) {
    if (result.error === "wrong-password") {
      return {
        ok: false as const,
        error: input.lang === "zh" ? "当前密码不正确" : "Current password is incorrect"
      };
    }
    return {
      ok: false as const,
      error: input.lang === "zh" ? "新密码至少 8 位" : "New password must be at least 8 characters"
    };
  }

  revalidateSettingsPaths();
  return { ok: true as const };
}

export async function toggleOAuthAction(input: {
  lang: Locale;
  provider: OAuthProvider;
  connected: boolean;
}) {
  const ctx = await requireCreatorContext(input.lang);
  if (!ctx.ok) {
    return ctx;
  }

  await toggleCreatorOAuth(ctx.creatorId, ctx.creator, input.provider, input.connected);
  revalidateSettingsPaths();
  return { ok: true as const };
}

export async function toggleTwoFactorAction(input: { lang: Locale; enabled: boolean }) {
  const ctx = await requireCreatorContext(input.lang);
  if (!ctx.ok) {
    return ctx;
  }

  await toggleCreatorTwoFactor(ctx.creatorId, ctx.creator, input.enabled);
  revalidateSettingsPaths();
  return { ok: true as const };
}

export async function revokeDeviceAction(input: { lang: Locale; deviceId: string }) {
  const ctx = await requireCreatorContext(input.lang);
  if (!ctx.ok) {
    return ctx;
  }

  await revokeCreatorDevice(ctx.creatorId, ctx.creator, input.deviceId);
  revalidateSettingsPaths();
  return { ok: true as const };
}

export async function updateSecurityPrefsAction(input: {
  lang: Locale;
  login_alerts?: boolean;
  suspicious_login_block?: boolean;
  recovery_email?: string | null;
}) {
  const ctx = await requireCreatorContext(input.lang);
  if (!ctx.ok) {
    return ctx;
  }

  await updateCreatorSecurityPrefs(ctx.creatorId, ctx.creator, {
    login_alerts: input.login_alerts,
    suspicious_login_block: input.suspicious_login_block,
    recovery_email: input.recovery_email
  });
  revalidateSettingsPaths();
  return { ok: true as const };
}
