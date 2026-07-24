"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { clearDemoSession } from "@/lib/demo-auth-server";
import { parseDemoSession, DEMO_USERS } from "@/lib/demo-auth";
import { withLocale, appPath, type Locale } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/app-language";
import { getOrCreateOpenInquiry } from "@/lib/chat-service";
import { getOrCreateVisitorId } from "@/features/auth/session-context";
import { createProject } from "@/lib/project-service";
import { createClient } from "@/lib/supabase/server";
import { loginAdminWithTotp, logoutAdminSession } from "@/features/admin/auth/admin-auth.service";
import { adminAuthError } from "@/lib/auth/admin-auth-errors";
import { enforceAdminLoginRateLimit } from "@/lib/auth/admin-login-rate-limit";
import { adminRequestFromHeaders } from "@/lib/auth/admin-request-from-headers";

async function resolveActionLocale(formData: FormData): Promise<Locale> {
  const raw = String(formData.get("lang") ?? "").trim();
  return resolveServerLocale(raw || null);
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
    client_email: `${await getOrCreateVisitorId()}@visitor.vincis.local`,
    company_name: ""
  };
}

export async function submitInquiryAction(formData: FormData) {
  const lang = await resolveActionLocale(formData);
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
  const lang = await resolveActionLocale(formData);
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
  const lang = await resolveActionLocale(formData);
  const orderId = String(formData.get("order_id") ?? "");
  if (orderId) {
    redirect(withLocale(`/brand/orders/${orderId}?pay=1`, lang));
  }
  redirect(withLocale("/creators", lang));
}

export async function updateOrderAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  redirect(appPath(`/admin/orders/${orderId}?updated=1`));
}

export async function signOutAction(_formData?: FormData) {
  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  await clearDemoSession();

  redirect("/");
}

/** Admin TOTP login — Server Action sets HttpOnly session cookie then redirects (reliable vs fetch + JSON). */
export async function adminLoginAction(formData: FormData) {
  const lang = await resolveActionLocale(formData);
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  const nextPath = String(formData.get("next") ?? "").trim();
  const request = await adminRequestFromHeaders("/admin/login");

  try {
    await enforceAdminLoginRateLimit(request, email);
  } catch {
    redirect(
      withLocale(
        `/admin/login?error=${encodeURIComponent(adminAuthError(lang, "rateLimited"))}&email=${encodeURIComponent(email)}`,
        lang
      )
    );
  }

  const result = await loginAdminWithTotp({ request, email, code, lang, nextPath });
  if (!result.ok) {
    redirect(
      withLocale(
        `/admin/login?error=${encodeURIComponent(result.error)}&email=${encodeURIComponent(email)}`,
        lang
      )
    );
  }

  redirect(result.redirectTo);
}

/** Admin portal sign-out — clears isolated admin session only, returns to /admin/login. */
export async function adminSignOutAction(_formData?: FormData) {
  const request = await adminRequestFromHeaders("/admin");

  await logoutAdminSession({ request });
  redirect(appPath("/admin/login?signedOut=1"));
}
