"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { performSignIn, recordCreatorSignIn } from "@/lib/auth/sign-in-service";
import { preferDemoAuth } from "@/lib/can-persist-local-store";
import { DEMO_SESSION_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { clearDemoSession, setDemoSession } from "@/lib/demo-auth-server";
import { demoRedirectForRole, demoUserForSocialProvider, parseDemoSession, DEMO_USERS } from "@/lib/demo-auth";
import { withLocale, type Locale } from "@/lib/i18n";
import { getOrCreateOpenInquiry } from "@/lib/chat-service";
import { getOrCreateVisitorId } from "@/lib/client-session";
import { createProject } from "@/lib/project-service";
import { createClient } from "@/lib/supabase/server";

type OAuthProvider = "google" | "github" | "apple" | "discord";
type DemoSocialProvider = "google" | "apple" | "discord";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return String(raw ?? "en") === "zh" ? "zh" : "en";
}

async function resolveInquiryClient(lang: Locale) {
  if (!hasSupabaseConfig()) {
    const cookieStore = await cookies();
    const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
    if (session) {
      const demoUser = DEMO_USERS.find((user) => user.email === session.email.toLowerCase());
      return {
        client_name: demoUser?.label ?? session.email.split("@")[0],
        client_email: session.email.toLowerCase(),
        company_name: demoUser?.label ?? ""
      };
    }
  }

  return {
    client_name: lang === "zh" ? "访客品牌方" : "Guest brand",
    client_email: `${await getOrCreateVisitorId()}@visitor.studioos.local`,
    company_name: ""
  };
}

export async function submitInquiryAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const creatorId = String(formData.get("creator_id") ?? "");
  const budget_range = String(formData.get("budget_range") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!budget_range || !message || !creatorId) {
    redirect(withLocale(`/creators/${creatorId || "creator_01"}?error=missing-inquiry#inquiry`, lang));
  }

  const client = await resolveInquiryClient(lang);

  const { inquiry } = await getOrCreateOpenInquiry({
    creator_id: creatorId,
    work_id: String(formData.get("work_id") ?? "") || null,
    client_name: client.client_name,
    client_email: client.client_email,
    company_name: client.company_name,
    budget_range,
    message
  });

  redirect(withLocale(`/proposal/${inquiry.id}`, lang));
}

export async function submitProjectAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const companyName = String(formData.get("company_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const campaignGoal = String(formData.get("campaign_goal") ?? "").trim();

  if (!companyName) {
    redirect(`/start?error=missing-company&lang=${lang}`);
  }

  if (!email || !campaignGoal) {
    redirect(`/start?error=missing-fields&lang=${lang}`);
  }

  const client = await resolveInquiryClient(lang);

  const project = await createProject({
    client_email: client.client_email,
    client_name: client.client_name,
    company_name: companyName,
    email,
    product_url: String(formData.get("product_url") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    target_platform: String(formData.get("target_platform") ?? "").trim(),
    video_format: String(formData.get("video_format") ?? "").trim(),
    video_count: Number(formData.get("video_count") ?? 1) || 1,
    budget_range: String(formData.get("budget_range") ?? "").trim(),
    deadline: String(formData.get("deadline") ?? "").trim(),
    brand_style: String(formData.get("brand_style") ?? "").trim(),
    reference_links: String(formData.get("reference_links") ?? "").trim(),
    campaign_goal: campaignGoal,
    notes: String(formData.get("notes") ?? "").trim()
  });

  redirect(withLocale(`/match/${project.id}`, lang));
}

export async function createCheckoutAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const orderId = String(formData.get("order_id") ?? "");
  if (orderId) {
    redirect(withLocale(`/dashboard/orders/${orderId}?pay=1`, lang));
  }
  redirect(withLocale("/creators", lang));
}

export async function updateOrderAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  const lang = normalizeLang(formData.get("lang"));
  redirect(`/admin/orders/${orderId}?updated=1&lang=${lang}`);
}

export async function signInAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const expectedRoleRaw = String(formData.get("expected_role") ?? "");
  const expectedRole = expectedRoleRaw === "creator" ? "creator" : expectedRoleRaw === "brand" ? "brand" : "";
  const nextPath = String(formData.get("next") ?? "").trim();

  const result = await performSignIn({
    email,
    password,
    lang,
    expectedRole,
    nextPath
  });

  if (!result.ok) {
    const roleParam = result.role ?? (expectedRole || "brand");
    if (result.errorCode === "wrong-role") {
      redirect(`/login?error=wrong-role&lang=${lang}&role=${roleParam}`);
    }
    redirect(
      `/login?error=${encodeURIComponent(result.error)}&lang=${lang}&role=${roleParam}&email=${encodeURIComponent(result.email ?? email.trim())}`
    );
  }

  redirect(result.redirectTo);
}

export async function demoSocialSignInAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const provider = String(formData.get("provider") ?? "") as DemoSocialProvider;
  const expectedRole = String(formData.get("expected_role") ?? "brand");
  const nextPath = String(formData.get("next") ?? "").trim();

  if (!preferDemoAuth()) {
    redirect(`/login?error=unsupported-provider&lang=${lang}&role=${expectedRole}`);
  }

  if (!["google", "apple", "discord"].includes(provider)) {
    redirect(`/login?error=unsupported-provider&lang=${lang}&role=${expectedRole}`);
  }

  const tabRole = expectedRole === "creator" ? "creator" : "brand";
  const demoUser = demoUserForSocialProvider(provider, tabRole);

  if (!demoUser) {
    redirect(
      `/login?error=${encodeURIComponent(lang === "zh" ? "暂无可用演示账号" : "No demo account available")}&lang=${lang}&role=${expectedRole}`
    );
  }

  await setDemoSession({ email: demoUser.email, role: demoUser.role });
  if (demoUser.role === "creator") {
    await recordCreatorSignIn(demoUser.email);
  }
  if (nextPath.startsWith("/")) {
    redirect(withLocale(nextPath, lang));
  }
  redirect(`${demoRedirectForRole(demoUser.role)}?lang=${lang}`);
}

export async function signUpAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));

  if (!hasSupabaseConfig()) {
    redirect(
      `/login?error=${encodeURIComponent(lang === "zh" ? "演示模式请使用邮箱登录或 Google / Apple / Discord 登录。" : "Demo mode: sign in with email or Google / Apple / Discord.")}&lang=${lang}&site=global&auth=login`
    );
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`
    }
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&lang=${lang}`);
  }

  redirect(`/dashboard?signup=success&lang=${lang}`);
}

export async function oauthSignInAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const provider = String(formData.get("provider") ?? "") as OAuthProvider;

  if (!hasSupabaseConfig()) {
    redirect(
      `/login?error=${encodeURIComponent("OAuth is disabled in demo mode. Use the preset email and password accounts below.")}&lang=${lang}&site=global`
    );
  }

  if (!["google", "github"].includes(provider)) {
    redirect(`/login?error=unsupported-provider&lang=${lang}&site=global`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`
    }
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "OAuth unavailable")}&lang=${lang}&site=global`);
  }

  redirect(data.url);
}

export async function signOutAction(formData?: FormData) {
  const lang = String(formData?.get("lang") ?? "en");

  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } else {
    await clearDemoSession();
  }

  redirect(`/?lang=${lang}`);
}
