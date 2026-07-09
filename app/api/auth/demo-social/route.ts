import { NextResponse } from "next/server";
import { performSignIn } from "@/lib/auth/sign-in-service";
import { preferDemoAuth } from "@/lib/can-persist-local-store";
import {
  DEMO_PASSWORD,
  demoUserForSocialProvider,
  isTestSocialProvider,
  type DemoSocialProvider
} from "@/lib/demo-auth";
import { withLocale, type Locale } from "@/lib/i18n";

export const runtime = "nodejs";

function normalizeLang(value: FormDataEntryValue | null): Locale {
  return String(value ?? "en") === "zh" ? "zh" : "en";
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

function allowDemoSocialLogin() {
  return (
    process.env.VINCIS_ENABLE_DEMO_LOGIN === "1" ||
    process.env.STUDIOOS_ENABLE_DEMO_LOGIN === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

function loginErrorPath({
  lang,
  role,
  error,
  email
}: {
  lang: Locale;
  role: "brand" | "creator";
  error: string;
  email?: string;
}) {
  const emailQuery = email ? `&email=${encodeURIComponent(email)}` : "";
  return withLocale(`/login?error=${encodeURIComponent(error)}&role=${role}${emailQuery}`, lang);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const lang = normalizeLang(formData.get("lang"));
  const provider = String(formData.get("provider") ?? "") as DemoSocialProvider;
  const role = String(formData.get("expected_role") ?? "") === "creator" ? "creator" : "brand";
  const nextPath = String(formData.get("next") ?? "").trim();

  if (!allowDemoSocialLogin()) {
    return redirectTo(request, loginErrorPath({ lang, role, error: "demo-login-disabled" }));
  }

  if (!["google", "apple", "alipay", "wechat", "qq"].includes(provider)) {
    return redirectTo(request, loginErrorPath({ lang, role, error: "unsupported-provider" }));
  }

  const allowDemoProvider = preferDemoAuth() || isTestSocialProvider(provider);
  if (!allowDemoProvider) {
    return redirectTo(request, loginErrorPath({ lang, role, error: "unsupported-provider" }));
  }

  const demoUser = demoUserForSocialProvider(provider, role);
  if (!demoUser) {
    return redirectTo(
      request,
      loginErrorPath({
        lang,
        role,
        error: lang === "zh" ? "暂无可用演示账号" : "No demo account available"
      })
    );
  }

  const result = await performSignIn({
    email: demoUser.email,
    password: DEMO_PASSWORD,
    lang,
    expectedRole: role,
    nextPath
  });

  if (!result.ok) {
    return redirectTo(
      request,
      loginErrorPath({
        lang,
        role,
        error: result.errorCode ?? result.error,
        email: result.email
      })
    );
  }

  return redirectTo(request, result.redirectTo);
}
