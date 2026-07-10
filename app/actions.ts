"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { performSignIn, recordCreatorSignIn } from "@/lib/auth/sign-in-service";
import { authService } from "@/features/auth/auth.service";
import { DEMO_SESSION_COOKIE, hasSupabaseConfig } from "@/lib/auth-config";
import { clearDemoSession, setDemoSession } from "@/lib/demo-auth-server";
import {
  demoRedirectForRole,
  parseDemoSession,
  DEMO_USERS
} from "@/lib/demo-auth";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { isAdminRouteRole } from "@/lib/auth/route-access";
import { AUTH_ERROR_COPY } from "@/features/auth/auth-error-copy";
import { withLocale, appPath, type Locale } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/app-language";
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
import { authSecurityService } from "@/features/auth/auth-security.service";

type OAuthProvider = "google" | "apple" | "alipay" | "wechat" | "qq";

async function resolveActionLocale(formData: FormData): Promise<Locale> {
  const raw = String(formData.get("lang") ?? "").trim();
  return resolveServerLocale(raw || null);
}

function loginErrorRedirect(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return `/login${query ? `?${query}` : ""}`;
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
    redirect(withLocale(`/dashboard/orders/${orderId}?pay=1`, lang));
  }
  redirect(withLocale("/creators", lang));
}

export async function updateOrderAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  redirect(appPath(`/admin/orders/${orderId}?updated=1`));
}

export async function signInAction(formData: FormData) {
  const lang = await resolveActionLocale(formData);
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
      redirect(loginErrorRedirect({ error: result.error, role: roleParam }));
    }
    redirect(
      loginErrorRedirect({
        error: result.error,
        role: roleParam,
        email: result.email ?? email.trim()
      })
    );
  }

  redirect(result.redirectTo);
}

export async function loginEmailStartAction(formData: FormData) {
  const lang = await resolveActionLocale(formData);
  const email = String(formData.get("email") ?? "").trim();
  const roleRaw = String(formData.get("expected_role") ?? "brand");
  const role = roleRaw === "creator" ? "CREATOR" : "BRAND";
  const request = await adminRequestFromHeaders("/login");
  try {
    return await authSecurityService.startEmailVerification({
      request,
      email,
      locale: lang,
      role
    });
  } catch (error) {
    const prismaCode =
      error && typeof error === "object" && "code" in error ? String((error as { code: string }).code) : "";
    const message =
      prismaCode === "P2021"
        ? lang === "zh"
          ? "认证数据表尚未创建，请在项目目录运行：npm run db:migrate:deploy"
          : "Auth database tables are missing. Run: npm run db:migrate:deploy"
        : lang === "zh"
          ? "认证服务暂不可用，请稍后再试。"
          : "Authentication service unavailable.";
    return { ok: false as const, error: message };
  }
}

export async function loginEmailContinueAction(formData: FormData) {
  const lang = await resolveActionLocale(formData);
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "brand");
  const role = roleRaw === "creator" ? "CREATOR" : "BRAND";
  const nextPath = String(formData.get("next") ?? "").trim();
  const request = await adminRequestFromHeaders("/login");

  try {
    const result = await authSecurityService.loginWithEmailCode({
      request,
      email,
      code,
      role,
      locale: lang,
      nextPath
    });

    if (result.ok && "session" in result && result.session) {
      await setDemoSession(result.session);
    }

    return result;
  } catch (error) {
    const prismaCode =
      error && typeof error === "object" && "code" in error ? String((error as { code: string }).code) : "";
    const message =
      prismaCode === "P2021"
        ? lang === "zh"
          ? "认证数据表尚未创建，请在项目目录运行：npm run db:migrate:deploy"
          : "Auth database tables are missing. Run: npm run db:migrate:deploy"
        : lang === "zh"
          ? "认证服务暂不可用，请稍后再试。"
          : "Authentication service unavailable.";
    return { ok: false as const, error: message };
  }
}

export async function demoSocialSignInAction(formData: FormData) {
  const lang = await resolveActionLocale(formData);
  const expectedRole = String(formData.get("expected_role") ?? "brand");
  redirect(withLocale(`/login?error=unsupported-provider&role=${expectedRole}`, lang));
}

export async function signUpAction(formData: FormData) {
  const lang = await resolveActionLocale(formData);
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
      redirect(loginErrorRedirect({ error: AUTH_ERROR_COPY.credentialsInvalid }));
    }

    await setDemoSession({
      email: result.user.email,
      role: isCreator ? "creator" : "client",
      userId: result.user.id
    });
    redirect(appPath(isCreator ? "/studio" : "/brand"));
  }

  if (!hasSupabaseConfig()) {
    redirect(
      loginErrorRedirect({
        error: lang === "zh" ? "数据库未配置，无法注册账号。" : "Database is not configured. Cannot create accounts.",
        site: "global",
        auth: "login"
      })
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
    redirect(loginErrorRedirect({ error: error.message }));
  }

  redirect(appPath("/dashboard?signup=success"));
}

export async function oauthSignInAction(formData: FormData) {
  const lang = await resolveActionLocale(formData);
  const provider = String(formData.get("provider") ?? "") as OAuthProvider;
  const expectedRole = String(formData.get("expected_role") ?? "brand");
  const entryRole = expectedRole === "creator" ? "creator" : "brand";
  const nextPath = String(formData.get("next") ?? "").trim();
  const headerList = await headers();
  const actionRequest = new Request(`${getAppBaseUrl()}/api/auth/oauth/action`, {
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
