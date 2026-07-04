"use server";

import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { authService } from "@/features/auth/auth.service";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { setDemoSession } from "@/lib/demo-auth-server";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

function signupErrorRedirect(error: string, lang: Locale, role: string) {
  redirect(`/signup?error=${encodeURIComponent(error)}&lang=${lang}&role=${role === "creator" ? "creator" : "brand"}`);
}

export async function signUpMvpAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "brand");
  const company = String(formData.get("company_name") ?? "").trim();

  if (!email || password.length < 8) {
    signupErrorRedirect(lang === "zh" ? "请填写邮箱，并设置至少 8 位密码。" : "Enter an email and a password with at least 8 characters.", lang, role);
  }

  if (hasDatabaseUrl()) {
    const isCreator = role === "creator" || role === "studio";
    const result = await authService.register({
      email,
      password,
      role: isCreator ? "CREATOR" : "BRAND",
      fullName: name || company || email.split("@")[0] || "StudioOS User",
      companyName: isCreator ? undefined : company || name,
      displayName: isCreator ? name || company || email.split("@")[0] : undefined
    });

    if (!result.ok) {
      signupErrorRedirect(result.error, lang, role);
    }

    await setDemoSession({
      email: result.user.email,
      role: isCreator ? "creator" : "client",
      userId: result.user.id
    });
    redirect(isCreator ? `/studio?lang=${lang}` : `/brand?lang=${lang}`);
  }

  if (!hasSupabaseConfig()) {
    signupErrorRedirect(lang === "zh" ? "数据库未配置，无法注册账号。" : "Database is not configured. Cannot create accounts.", lang, role);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role === "creator" || role === "studio" ? "creator" : "brand",
        name,
        company_name: company
      }
    }
  });

  if (error) {
    signupErrorRedirect(error.message, lang, role);
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      role: role === "creator" || role === "studio" ? "creator" : "brand",
      name: name || email.split("@")[0],
      company_name: company
    });
  }

  redirect(`/login?signup=success&lang=${lang}&role=${role === "creator" ? "creator" : "brand"}&email=${encodeURIComponent(email)}`);
}
