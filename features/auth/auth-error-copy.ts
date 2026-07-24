import type { Locale } from "@/lib/i18n";

/** Maps Prisma setup/migration errors to user-facing copy; null = use generic fallback. */
export function authDatabaseSetupErrorMessage(
  prismaCode: string,
  locale: Locale
): string | null {
  if (prismaCode === "P2021") {
    return locale === "zh"
      ? "认证数据表尚未创建，请在项目目录运行：npm run db:migrate:deploy"
      : "Auth database tables are missing. Run: npm run db:migrate:deploy";
  }
  return null;
}

export const AUTH_ERROR_COPY = {
  rateLimited: "请求过于频繁，请稍后再试。",
  codeInvalid: "验证码不正确或已过期。",
  credentialsInvalid: "账号或密码不正确。",
  securityFailed: "安全验证失败，请稍后重试。",
  oauthFailed: "第三方登录失败，请稍后再试。",
  testAccountRetired:
    "测试账号已停用，请使用真实邮箱或 Google / 支付宝登录。",
  identityRoleConflictBrand:
    "该邮箱已注册为品牌方身份，无法再以创作者身份注册或登录。请切换到品牌方登录，或使用其他邮箱。",
  identityRoleConflictCreator:
    "该邮箱已注册为创作者身份，无法再以品牌方身份注册或登录。请切换到创作者登录，或使用其他邮箱。"
} as const;
