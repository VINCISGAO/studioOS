import { redirect } from "next/navigation";
import { AdminLoginShell, type AdminLoginCopy } from "@/components/studioos/admin-login-shell";
import { getSessionUser } from "@/features/auth/session.service";
import { isPrismaAdminRole, prismaRoleToDemoRole } from "@/lib/auth/route-access";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-redirect";
import { getLocale, type Locale, type SearchParams } from "@/lib/i18n";

type AdminLoginPageProps = {
  searchParams: Promise<SearchParams & { next?: string; error?: string; email?: string }>;
};

const copy: Record<Locale, AdminLoginCopy> = {
  en: {
    consoleTitle: "Administrator Console",
    email: "Email",
    emailPlaceholder: "admin@studioos.test",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    rememberDevice: "Remember this device",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    copyright: "© StudioOS. All rights reserved.",
    environment: "Environment",
    version: "Version",
    region: "Region",
    status: "Status",
    secureConnection: "Secure Connection ✓",
    invalidCredentials: "Invalid email or password.",
    adminRequired: "This account does not have administrator access.",
    networkError: "Network error. Please try again."
  },
  zh: {
    consoleTitle: "管理后台",
    email: "邮箱",
    emailPlaceholder: "admin@studioos.test",
    password: "密码",
    passwordPlaceholder: "输入密码",
    rememberDevice: "记住此设备",
    forgotPassword: "忘记密码？",
    signIn: "登录",
    copyright: "© StudioOS 保留所有权利。",
    environment: "环境",
    version: "版本",
    region: "区域",
    status: "状态",
    secureConnection: "安全连接 ✓",
    invalidCredentials: "邮箱或密码错误。",
    adminRequired: "该账号没有管理员权限。",
    networkError: "网络错误，请稍后重试。"
  }
};

function resolveNextPath(raw: SearchParams["next"]) {
  if (typeof raw === "string" && raw.startsWith("/admin")) return raw;
  if (Array.isArray(raw) && raw[0]?.startsWith("/admin")) return raw[0];
  return "/admin";
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const locale = getLocale(params);
  const t = copy[locale];
  const nextPath = resolveNextPath(params.next);
  const user = await getSessionUser();

  if (user && isPrismaAdminRole(user.role)) {
    redirect(
      resolvePostLoginDestination({ role: prismaRoleToDemoRole(user.role) }, nextPath, locale)
    );
  }

  const initialEmail = typeof params.email === "string" ? params.email : "admin@studioos.test";
  const error =
    typeof params.error === "string" && params.error !== "admin-required"
      ? params.error
      : undefined;

  return (
    <AdminLoginShell locale={locale} nextPath={nextPath} initialEmail={initialEmail} error={error} t={t} />
  );
}
