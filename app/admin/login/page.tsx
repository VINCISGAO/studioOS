import { redirect } from "next/navigation";
import { AdminLoginShell, type AdminLoginCopy } from "@/components/studioos/admin-login-shell";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import { readAdminSessionToken } from "@/features/admin/auth/admin-session-server";
import { cache } from "react";
import { adminProfileRepository } from "@/features/admin/auth/admin-profile.repository";

const getAdminLoginSetupStatus = cache(() => adminProfileRepository.getLoginSetupStatus());
import { getAppUiLocale } from "@/lib/app-language";
import { appPath, type Locale, type SearchParams } from "@/lib/i18n";
import { isProductionRuntime } from "@/lib/auth/admin-security-config";

type AdminLoginPageProps = {
  searchParams: Promise<SearchParams & { next?: string; error?: string; email?: string; signedOut?: string }>;
};

const copy: Record<Locale, AdminLoginCopy> = {
  en: {
    consoleTitle: "Admin Dashboard",
    productLabel: "VINCIS Admin",
    email: "Email",
    emailPlaceholder: "admin@example.com",
    authenticatorCode: "Authenticator Code",
    authenticatorPlaceholder: "6-digit code",
    authenticatorHint: "Google Authenticator only. No password or social login.",
    signIn: "Login",
    copyright: "© VINCIS. All rights reserved.",
    environment: "Environment",
    version: "Version",
    region: "Region",
    status: "Status",
    secureConnection: "Secure Connection ✓",
    invalidCredentials: "Sign-in failed. Check your authenticator code.",
    notConfigured: "Admin sign-in is temporarily unavailable. Contact your platform operator.",
    schemaNotReady:
      "Admin sign-in is temporarily unavailable. Contact your platform operator.",
    unavailableOps:
      "Admin auth tables are missing. Run npm run db:migrate:deploy, then npm run bootstrap:admin -- admin@example.com",
    networkError: "Sign-in failed. Check your authenticator code."
  },
  zh: {
    consoleTitle: "管理后台",
    productLabel: "VINCIS Admin",
    email: "邮箱",
    emailPlaceholder: "admin@example.com",
    authenticatorCode: "验证器代码",
    authenticatorPlaceholder: "6 位数字",
    authenticatorHint: "仅支持 Google 验证器，不可用密码或社交登录。",
    signIn: "登录",
    copyright: "© VINCIS 保留所有权利。",
    environment: "环境",
    version: "版本",
    region: "区域",
    status: "状态",
    secureConnection: "安全连接 ✓",
    invalidCredentials: "登录失败，请检查验证码。",
    notConfigured: "后台登录暂不可用，请联系平台运维。",
    schemaNotReady: "后台登录暂不可用，请联系平台运维。",
    unavailableOps:
      "Admin 认证表尚未创建。请先运行 npm run db:migrate:deploy，再执行 npm run bootstrap:admin -- admin@example.com 初始化管理员。",
    networkError: "登录失败，请检查验证码。"
  }
};

function resolveNextPath(raw: SearchParams["next"]) {
  if (typeof raw === "string" && raw.startsWith("/admin")) return raw;
  if (Array.isArray(raw) && raw[0]?.startsWith("/admin")) return raw[0];
  return "/admin";
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const locale = await getAppUiLocale();
  const t = copy[locale];
  const nextPath = resolveNextPath(params.next);
  const hasSessionCookie = Boolean(await readAdminSessionToken());
  if (hasSessionCookie) {
    const profile = await validateAdminSession();
    if (profile) {
      redirect(appPath(nextPath));
    }
  }

  const initialEmail = typeof params.email === "string" ? params.email : "";
  const error = typeof params.error === "string" ? params.error : undefined;
  const signedOut = params.signedOut === "1";
  const setupStatus = await getAdminLoginSetupStatus();
  const loginUnavailable = !setupStatus.schemaReady || !setupStatus.totpConfigured;
  const showOpsHint = !isProductionRuntime();

  return (
    <AdminLoginShell
      locale={locale}
      nextPath={nextPath}
      initialEmail={initialEmail}
      error={error}
      signedOut={signedOut}
      loginUnavailable={loginUnavailable}
      showOpsHint={showOpsHint}
      schemaReady={setupStatus.schemaReady}
      totpConfigured={setupStatus.totpConfigured}
      t={t}
    />
  );
}
