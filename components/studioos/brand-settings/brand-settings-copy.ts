import type { Locale } from "@/lib/i18n";

export const brandSettingsCopy = {
  en: {
    title: "Account security",
    subtitle: "Protect your brand account and manage sign-in methods, devices, and security preferences.",
    saved: "Saved.",
    errorGeneric: "Something went wrong. Try again.",
    statLoginDevices: "Login devices",
    statTrustedDevices: "Trusted devices",
    statSecurityTips: "Security tips",
    statNeedsAction: "Needs attention",
    statLoginAlerts: "Login alerts",
    statRealtimeNotify: "Real-time notifications",
    statTwoFactor: "Two-factor authentication",
    statBoostSecurity: "Boost account security",
    statRecentLogin: "Recent login",
    statJustNow: "Just now",
    enabled: "Enabled",
    disabled: "Disabled",
    loginInfo: "Login details",
    email: "Email",
    phone: "Phone",
    edit: "Edit",
    twoFactor: "Two-factor authentication",
    twoFactorEnabled: "Enabled",
    twoFactorDisabled: "Disabled",
    twoFactorOnHint: "Two-factor authentication is on. A verification code is required at sign-in.",
    twoFactorOffHint:
      "Once enabled, a verification code is required at sign-in, adding a layer of protection.",
    manage2fa: "Manage verification",
    enable2fa: "Enable two-factor authentication",
    oauth: "Third-party login",
    connected: "Connected",
    notConnected: "Not connected",
    connect: "Connect",
    disconnect: "Disconnect",
    devices: "Login devices",
    devicesSubtitle: "Manage devices signed in to your account",
    viewAllDevices: "View all devices",
    noDevices: "No devices yet. Sign in again to record this device.",
    currentDevice: "Current device",
    securitySettings: "Security settings",
    loginAlerts: "Login alerts",
    loginAlertsHint: "Email me when a new device signs in.",
    suspiciousBlock: "Suspicious login blocking",
    suspiciousBlockHint: "Lock the account and notify me when suspicious sign-in is detected.",
    accountRecovery: "Account recovery",
    accountRecoveryHint: "Set a recovery email to regain access if you cannot sign in.",
    now: "Just now"
  },
  zh: {
    title: "账号安全",
    subtitle: "保护品牌方账号安全，管理登录方式、设备与安全偏好。",
    saved: "已保存。",
    errorGeneric: "出错了，请重试。",
    statLoginDevices: "登录设备",
    statTrustedDevices: "已信任设备",
    statSecurityTips: "安全提示",
    statNeedsAction: "需处理",
    statLoginAlerts: "登录提醒",
    statRealtimeNotify: "实时通知",
    statTwoFactor: "两步验证",
    statBoostSecurity: "提升账号安全",
    statRecentLogin: "最近登录",
    statJustNow: "刚刚",
    enabled: "已开启",
    disabled: "未开启",
    loginInfo: "登录信息",
    email: "邮箱",
    phone: "手机号码",
    edit: "修改",
    twoFactor: "两步验证",
    twoFactorEnabled: "已开启",
    twoFactorDisabled: "未开启",
    twoFactorOnHint: "两步验证已开启。登录时还需要输入验证码，为您的账号增加一层保护。",
    twoFactorOffHint: "开启两步验证后，登录时还需要输入验证码，为您的账号增加一层保护。",
    manage2fa: "管理验证方式",
    enable2fa: "开启两步验证",
    oauth: "第三方登录",
    connected: "已连接",
    notConnected: "未连接",
    connect: "连接",
    disconnect: "断开",
    devices: "登录设备",
    devicesSubtitle: "管理您已登录的设备",
    viewAllDevices: "查看所有设备",
    noDevices: "暂无设备记录，重新登录后将自动记录。",
    currentDevice: "当前设备",
    securitySettings: "安全设置",
    loginAlerts: "登录提醒",
    loginAlertsHint: "当有新设备登录时，通过邮件通知我。",
    suspiciousBlock: "可疑登录拦截",
    suspiciousBlockHint: "检测到可疑登录时，自动锁定账号并通知我。",
    accountRecovery: "账号恢复",
    accountRecoveryHint: "设置账号恢复方式，以便在无法登录时找回账号。",
    now: "刚刚"
  }
} as const;

export type BrandSettingsCopy = (typeof brandSettingsCopy)[Locale];

export function formatSettingsRelativeTime(iso: string, locale: Locale, nowLabel: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 2) return nowLabel;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return locale === "zh" ? `${diffHours} 小时前` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return locale === "zh" ? `${diffDays} 天前` : `${diffDays}d ago`;
}
