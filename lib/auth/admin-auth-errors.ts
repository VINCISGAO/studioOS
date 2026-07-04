import type { Locale } from "@/lib/i18n";

const COPY = {
  zh: {
    loginFailed: "登录失败，请检查验证码。",
    rateLimited: "登录尝试过多，请稍后再试。",
    noAccess: "当前账号无后台访问权限。",
    pendingSetup: "该账号尚未完成验证器绑定，请使用主账号提供的绑定链接。",
    securityMisconfigured: "后台安全配置未完成，请联系运维设置 AUTH_SECURITY_SECRET。",
    totpDecryptFailed:
      "验证器密钥无法解密（AUTH_SECURITY_SECRET 可能已变更）。请用 ADMIN_TOTP_SECRET 重新 bootstrap。"
  },
  en: {
    loginFailed: "Sign-in failed. Check your authenticator code.",
    rateLimited: "Too many sign-in attempts. Try again later.",
    noAccess: "This account does not have admin access.",
    pendingSetup: "This account has not completed authenticator setup. Use the setup link from the master admin.",
    securityMisconfigured: "Admin security is misconfigured. Set AUTH_SECURITY_SECRET in production.",
    totpDecryptFailed:
      "Authenticator secret cannot be decrypted (AUTH_SECURITY_SECRET may have changed). Re-run bootstrap with ADMIN_TOTP_SECRET."
  }
} as const;

export function adminAuthError(locale: Locale, key: keyof (typeof COPY)["en"]) {
  return COPY[locale][key];
}
