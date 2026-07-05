"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { performSignIn, recordCreatorSignIn } from "@/lib/auth/sign-in-service";
import { authService } from "@/features/auth/auth.service";
import { preferDemoAuth } from "@/lib/can-persist-local-store";
import { DEMO_SESSION_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { clearDemoSession, setDemoSession } from "@/lib/demo-auth-server";
import {
  demoRedirectForRole,
  demoUserForSocialProvider,
  isTestSocialProvider,
  parseDemoSession,
  DEMO_PASSWORD,
  DEMO_USERS,
  type DemoSocialProvider
} from "@/lib/demo-auth";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isAdminRouteRole } from "@/lib/auth/route-access";
import { AUTH_ERROR_COPY } from "@/features/auth/auth-error-copy";
import { withLocale, type Locale } from "@/lib/i18n";
import { getOrCreateOpenInquiry } from "@/lib/chat-service";
import { getOrCreateVisitorId } from "@/lib/client-session";
import { createProject } from "@/lib/project-service";
import { createClient } from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { startOAuthSignInAction } from "@/features/auth/oauth-start.service";
import { loginAdminWithTotp, logoutAdminSession } from "@/features/admin/auth/admin-auth.service";
import { adminAuthError } from "@/lib/auth/admin-auth-errors";
import { enforceAdminLoginRateLimit } from "@/lib/auth/admin-login-rate-limit";
import { adminRequestFromHeaders } from "@/lib/auth/admin-request-from-headers";

type OAuthProvider = "google" | "apple" | "alipay" | "wechat" | "qq";
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

  const allowTestProvider = isTestSocialProvider(provider);
  if (!preferDemoAuth() && !allowTestProvider) {
    redirect(`/login?error=unsupported-provider&lang=${lang}&role=${expectedRole}`);
  }

  if (!["google", "apple", "alipay", "wechat", "qq"].includes(provider)) {
    redirect(`/login?error=unsupported-provider&lang=${lang}&role=${expectedRole}`);
  }

  const tabRole = expectedRole === "creator" ? "creator" : "brand";
  const demoUser = demoUserForSocialProvider(provider, tabRole);

  if (!demoUser) {
    redirect(
      `/login?error=${encodeURIComponent(lang === "zh" ? "暂无可用演示账号" : "No demo account available")}&lang=${lang}&role=${expectedRole}`
    );
  }

  const result = await performSignIn({
    email: demoUser.email,
    password: DEMO_PASSWORD,
    lang,
    expectedRole: tabRole,
    nextPath
  });

  if (!result.ok) {
    const errorQuery = result.errorCode ?? encodeURIComponent(result.error);
    redirect(
      withLocale(
        `/login?error=${errorQuery}&role=${expectedRole}${result.email ? `&email=${encodeURIComponent(result.email)}` : ""}`,
        lang
      )
    );
  }

  redirect(result.redirectTo);
}

export async function signUpAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "brand");

  if (hasDatabaseUrl()) {
    const isCreator = role === "creator" || role === "studio";
    const result = await authService.register({
      email,
      password,
      role: isCreator ? "CREATOR" : "BRAND",
      fullName: email.split("@")[0] || "VINCIS User",
      companyName: isCreator ? undefined : email.split("@")[0],
      displayName: isCreator ? email.split("@")[0] : undefined
    });

    if (!result.ok) {
      redirect(`/login?error=${encodeURIComponent(AUTH_ERROR_COPY.credentialsInvalid)}&lang=${lang}`);
    }

    await setDemoSession({
      email: result.user.email,
      role: isCreator ? "creator" : "client",
      userId: result.user.id
    });
    redirect(isCreator ? `/studio?lang=${lang}` : `/brand?lang=${lang}`);
  }

  if (!hasSupabaseConfig()) {
    redirect(
      `/login?error=${encodeURIComponent(lang === "zh" ? "数据库未配置，无法注册账号。" : "Database is not configured. Cannot create accounts.")}&lang=${lang}&site=global&auth=login`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppBaseUrl()}/auth/callback`
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
  const expectedRole = String(formData.get("expected_role") ?? "brand");
  const entryRole = expectedRole === "creator" ? "creator" : "brand";
  const nextPath = String(formData.get("next") ?? "").trim();
  const headerList = await headers();
  const actionRequest = new Request("https://studioos.local/api/auth/oauth/action", {
    method: "POST",
    headers: new Headers(headerList)
  });

  await startOAuthSignInAction({
    request: actionRequest,
    provider,
    lang,
    entryRole,
    nextPath
  });
}

export async function signOutAction(formData?: FormData) {
  const lang = String(formData?.get("lang") ?? "en");

  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  await clearDemoSession();

  redirect(`/?lang=${lang}`);
}

/** Admin TOTP login — Server Action sets HttpOnly session cookie then redirects (reliable vs fetch + JSON). */
export async function adminLoginAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
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
export async function adminSignOutAction(formData?: FormData) {
  const lang = normalizeLang(formData?.get("lang") ?? null);
  const request = await adminRequestFromHeaders("/admin");

  await logoutAdminSession({ request });
  redirect(withLocale("/admin/login?signedOut=1", lang));
}
