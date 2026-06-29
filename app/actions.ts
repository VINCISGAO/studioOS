"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { DEMO_SESSION_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { clearDemoSession, setDemoSession } from "@/lib/demo-auth-server";
import { demoRedirectForRole, parseDemoSession, DEMO_USERS, type DemoUser } from "@/lib/demo-auth";
import { getCreatorIdForDemoEmail } from "@/lib/creator-session";
import {
  authenticateDemoCreatorEmail,
  getStoredCreatorSettings,
  recordCreatorLogin
} from "@/lib/studioos/creator-settings-service";
import { creators } from "@/lib/data";
import { getCreatorById } from "@/lib/creator-service";
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

async function authenticateDemoLogin(email: string, password: string): Promise<DemoUser | null> {
  const normalized = email.trim().toLowerCase();
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
        if (password !== expected) {
          return null;
        }
        return { ...direct, password };
      }
    }

    if (direct.password !== password) {
      return null;
    }
    return direct;
  }

  const aliasAuth = await authenticateDemoCreatorEmail(email, password);
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

async function recordCreatorSignIn(email: string) {
  const { resolveCreatorIdByEmail } = await import("@/lib/studioos/creator-settings-service");
  const creatorId = await resolveCreatorIdByEmail(email);
  if (!creatorId) {
    return;
  }

  const creator = await getCreatorById(creatorId);
  if (!creator) {
    return;
  }

  const headerStore = await headers();
  await recordCreatorLogin(creatorId, creator, {
    userAgent: headerStore.get("user-agent") ?? "Unknown",
    ip:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      "127.0.0.1"
  });
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
    client_email: `${await getOrCreateVisitorId()}@visitor.adbridge.local`,
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
  const expectedRole = String(formData.get("expected_role") ?? "");
  const nextPath = String(formData.get("next") ?? "").trim();

  if (!hasSupabaseConfig()) {
    const demoUser = await authenticateDemoLogin(email, password);
    if (!demoUser) {
      const roleParam = expectedRole || "brand";
      redirect(
        `/login?error=${encodeURIComponent(lang === "zh" ? "邮箱或密码错误" : "Invalid email or password")}&lang=${lang}&role=${roleParam}&email=${encodeURIComponent(email.trim())}`
      );
    }

    if (
      expectedRole === "brand" &&
      demoUser.role !== "client" &&
      demoUser.role !== "admin"
    ) {
      redirect(`/login?error=wrong-role&lang=${lang}&role=brand`);
    }

    if (expectedRole === "creator" && demoUser.role !== "creator" && demoUser.role !== "admin") {
      redirect(`/login?error=wrong-role&lang=${lang}&role=creator`);
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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&lang=${lang}`);
  }

  redirect(`/dashboard?lang=${lang}`);
}

export async function demoSocialSignInAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const provider = String(formData.get("provider") ?? "") as DemoSocialProvider;
  const expectedRole = String(formData.get("expected_role") ?? "brand");
  const nextPath = String(formData.get("next") ?? "").trim();

  if (hasSupabaseConfig()) {
    redirect(`/login?error=unsupported-provider&lang=${lang}&role=${expectedRole}`);
  }

  if (!["google", "apple", "discord"].includes(provider)) {
    redirect(`/login?error=unsupported-provider&lang=${lang}&role=${expectedRole}`);
  }

  const role = expectedRole === "creator" ? "creator" : "client";
  const roleAccounts = DEMO_USERS.filter((user) => user.role === role);
  const index = provider === "google" ? 0 : provider === "apple" ? 1 : 2;
  const demoUser = roleAccounts[index] ?? roleAccounts[0];

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
      `/login?error=${encodeURIComponent("Demo mode uses the preset accounts below. Registration is disabled until Supabase is configured.")}&lang=${lang}&site=global&auth=login`
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
