"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "@/lib/i18n";
import { requireBrandPortalClientEmail } from "@/features/auth/session-context";
import type { OAuthProvider } from "@/lib/studioos/creator-settings-types";
import {
  revokeBrandDevice,
  toggleBrandOAuth,
  toggleBrandTwoFactor,
  updateBrandContactEmail,
  updateBrandPassword,
  updateBrandPhone,
  updateBrandSecurityPrefs
} from "@/lib/studioos/brand-settings-service";

function revalidateBrandSettingsPaths() {
  revalidatePath("/brand/settings");
  revalidatePath("/brand");
  revalidatePath("/brand/brand-center");
}

async function requireBrandContext(lang: Locale) {
  try {
    const email = await requireBrandPortalClientEmail();
    return { ok: true as const, email };
  } catch {
    return { ok: false as const, error: lang === "zh" ? "请先登录" : "Sign in required" };
  }
}

export async function updateBrandContactEmailAction(input: { lang: Locale; email: string }) {
  const ctx = await requireBrandContext(input.lang);
  if (!ctx.ok) return ctx;

  const result = await updateBrandContactEmail(ctx.email, input.email);
  if (!result.ok) {
    return {
      ok: false as const,
      error: input.lang === "zh" ? "邮箱格式无效" : "Invalid email address"
    };
  }

  revalidateBrandSettingsPaths();
  return { ok: true as const };
}

export async function updateBrandPhoneAction(input: { lang: Locale; phone: string }) {
  const ctx = await requireBrandContext(input.lang);
  if (!ctx.ok) return ctx;

  const result = await updateBrandPhone(ctx.email, input.phone);
  if (!result.ok) {
    return {
      ok: false as const,
      error: input.lang === "zh" ? "请输入有效手机号" : "Enter a valid phone number"
    };
  }

  revalidateBrandSettingsPaths();
  return { ok: true as const };
}

export async function updateBrandPasswordAction(input: {
  lang: Locale;
  currentPassword: string;
  nextPassword: string;
}) {
  const ctx = await requireBrandContext(input.lang);
  if (!ctx.ok) return ctx;

  const result = await updateBrandPassword(ctx.email, input.currentPassword, input.nextPassword);
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

  revalidateBrandSettingsPaths();
  return { ok: true as const };
}

export async function toggleBrandOAuthAction(input: {
  lang: Locale;
  provider: OAuthProvider;
  connected: boolean;
}) {
  const ctx = await requireBrandContext(input.lang);
  if (!ctx.ok) return ctx;

  await toggleBrandOAuth(ctx.email, input.provider, input.connected);
  revalidateBrandSettingsPaths();
  return { ok: true as const };
}

export async function toggleBrandTwoFactorAction(input: { lang: Locale; enabled: boolean }) {
  const ctx = await requireBrandContext(input.lang);
  if (!ctx.ok) return ctx;

  await toggleBrandTwoFactor(ctx.email, input.enabled);
  revalidateBrandSettingsPaths();
  return { ok: true as const };
}

export async function revokeBrandDeviceAction(input: { lang: Locale; deviceId: string }) {
  const ctx = await requireBrandContext(input.lang);
  if (!ctx.ok) return ctx;

  await revokeBrandDevice(ctx.email, input.deviceId);
  revalidateBrandSettingsPaths();
  return { ok: true as const };
}

export async function updateBrandSecurityPrefsAction(input: {
  lang: Locale;
  login_alerts?: boolean;
  suspicious_login_block?: boolean;
  recovery_email?: string | null;
}) {
  const ctx = await requireBrandContext(input.lang);
  if (!ctx.ok) return ctx;

  await updateBrandSecurityPrefs(ctx.email, {
    login_alerts: input.login_alerts,
    suspicious_login_block: input.suspicious_login_block,
    recovery_email: input.recovery_email
  });
  revalidateBrandSettingsPaths();
  return { ok: true as const };
}
