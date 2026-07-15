import { redirect } from "next/navigation";
import { cache } from "react";
import { AdminLoginShell, type AdminLoginCopy } from "@/components/studioos/admin-login-shell";
import { validateAdminSession } from "@/features/admin/auth/admin-auth.service";
import { adminProfileRepository } from "@/features/admin/auth/admin-profile.repository";
import { readAdminSessionToken } from "@/features/admin/auth/admin-session-server";
import { getAppUiLocale } from "@/lib/app-language";
import { isProductionRuntime } from "@/lib/auth/admin-security-config";
import { appPath, type Locale, type SearchParams } from "@/lib/i18n";

const getAdminLoginSetupStatus = cache(() => adminProfileRepository.getLoginSetupStatus());

type AdminLoginPageProps = {
  searchParams: Promise<SearchParams & { next?: string; error?: string; email?: string; signedOut?: string }>;
};

const copy: Record<Locale, AdminLoginCopy> = {
  en: {
    consoleTitle: "Admin Dashboard",
    email: "Email",
    emailPlaceholder: "admin@example.com",
    authenticatorPlaceholder: "6-digit code",
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
    email: "邮箱",
    emailPlaceholder: "admin@example.com",
    authenticatorPlaceholder: "6 位数字",
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
      "管理员认证表尚未创建。请先运行数据库迁移，再执行管理员初始化命令完成配置。",
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
  const signedOut = params.signedOut === "1";
  const setupStatus = await getAdminLoginSetupStatus();
  const loginUnavailable = !setupStatus.schemaReady || !setupStatus.totpConfigured;
  // Drop stale ?error= from a prior login attempt when no active TOTP admin exists.
  const error =
    loginUnavailable || typeof params.error !== "string" ? undefined : params.error;
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
