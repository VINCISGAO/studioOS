"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  revokeDeviceAction,
  toggleOAuthAction,
  toggleTwoFactorAction,
  updateContactEmailAction,
  updatePasswordAction,
  updatePhoneAction,
  updateSecurityPrefsAction
} from "@/app/studio-settings-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type {
  CreatorSettingsViewModel,
  LoginDevice,
  OAuthProvider
} from "@/lib/studioos/creator-settings-types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronRight,
  Laptop,
  Lock,
  Mail,
  Monitor,
  MoreVertical,
  Phone,
  ShieldCheck,
  Smartphone
} from "lucide-react";

const copy = {
  en: {
    back: "Back",
    title: "Account security",
    subtitle: "Protect your account and manage sign-in methods and devices.",
    saved: "Saved.",
    errorGeneric: "Something went wrong. Try again.",
    loginInfo: "Login details",
    email: "Email",
    password: "Password",
    phone: "Phone",
    edit: "Edit",
    twoFactor: "Two-factor authentication",
    twoFactorEnabled: "Enabled",
    twoFactorDisabled: "Disabled",
    twoFactorOnHint:
      "Two-factor authentication is on. A verification code is required at sign-in for extra protection.",
    twoFactorOffHint: "Add a verification code at sign-in for extra protection.",
    manage2fa: "Manage verification",
    enable2fa: "Enable 2FA",
    oauth: "Third-party login",
    connected: "Connected",
    notConnected: "Not connected",
    manage: "Manage",
    connect: "Connect",
    disconnect: "Disconnect",
    devices: "Login devices",
    currentDevice: "Current device",
    viewAllDevices: "View all devices",
    loginHistory: "Login history",
    noDevices: "No devices yet. Sign in again to record this device.",
    noHistory: "No login history yet.",
    revoke: "Remove",
    securitySettings: "Security settings",
    loginAlerts: "Login alerts",
    loginAlertsHint: "Email me when a new device signs in.",
    suspiciousBlock: "Suspicious login blocking",
    suspiciousBlockHint: "Lock the account and notify me when suspicious sign-in is detected.",
    accountRecovery: "Account recovery",
    accountRecoveryHint: "Set a recovery email to regain access if you cannot sign in.",
    configure: "Configure",
    now: "Now",
    success: "Success",
    failed: "Failed",
    save: "Save",
    cancel: "Cancel",
    dialogEmail: "Update email",
    dialogPassword: "Change password",
    dialogPhone: "Update phone",
    dialogRecovery: "Account recovery email",
    currentPassword: "Current password",
    newPassword: "New password",
    recoveryEmail: "Recovery email"
  },
  zh: {
    back: "返回",
    title: "账号安全",
    subtitle: "保护您的账户安全，管理登录方式与设备。",
    saved: "已保存。",
    errorGeneric: "出错了，请重试。",
    loginInfo: "登录信息",
    email: "邮箱",
    password: "密码",
    phone: "手机号码",
    edit: "修改",
    twoFactor: "两步验证",
    twoFactorEnabled: "已开启",
    twoFactorDisabled: "未开启",
    twoFactorOnHint: "两步验证已开启。登录时需要输入验证码，保护账户更安全。",
    twoFactorOffHint: "开启后，登录时需要输入验证码。",
    manage2fa: "管理验证方式",
    enable2fa: "开启两步验证",
    oauth: "第三方登录",
    connected: "已连接",
    notConnected: "未连接",
    manage: "管理",
    connect: "连接",
    disconnect: "断开",
    devices: "登录设备",
    currentDevice: "当前设备",
    viewAllDevices: "查看所有设备",
    loginHistory: "登录历史",
    noDevices: "暂无设备记录，重新登录后将自动记录。",
    noHistory: "暂无登录历史。",
    revoke: "移除",
    securitySettings: "安全设置",
    loginAlerts: "登录提醒",
    loginAlertsHint: "当有新设备登录时，通过邮件通知我。",
    suspiciousBlock: "可疑登录拦截",
    suspiciousBlockHint: "检测到可疑登录时，自动锁定账户并通知我。",
    accountRecovery: "账户恢复",
    accountRecoveryHint: "设置账户恢复方式，以便在无法登录时找回账户。",
    configure: "配置",
    now: "现在",
    success: "成功",
    failed: "失败",
    save: "保存",
    cancel: "取消",
    dialogEmail: "修改邮箱",
    dialogPassword: "修改密码",
    dialogPhone: "修改手机号",
    dialogRecovery: "账户恢复邮箱",
    currentPassword: "当前密码",
    newPassword: "新密码",
    recoveryEmail: "恢复邮箱"
  }
} as const;

function SecurityCard({
  title,
  badge,
  children,
  className
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {badge}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">{children}</div>
    </section>
  );
}

function SettingsToggle({
  checked,
  disabled,
  onCheckedChange,
  label
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50",
        checked ? "bg-indigo-600" : "bg-zinc-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function deviceIcon(device: LoginDevice) {
  if (device.os === "iOS" || device.device_name.includes("iPhone")) {
    return Smartphone;
  }
  if (device.os === "macOS" || device.device_name.includes("Mac")) {
    return Laptop;
  }
  return Monitor;
}

function browserLabel(device: LoginDevice) {
  return device.browser_version ? `${device.browser} ${device.browser_version}` : device.browser;
}

function formatRelativeTime(iso: string, locale: Locale, nowLabel: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 2) {
    return nowLabel;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return locale === "zh" ? `${diffHours} 小时前` : `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return locale === "zh" ? `${diffDays} 天前` : `${diffDays}d ago`;
}

export function StudioSettingsPage({
  locale,
  settings: initialSettings
}: {
  locale: Locale;
  settings: CreatorSettingsViewModel;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [flash, setFlash] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const [emailDialog, setEmailDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [phoneDialog, setPhoneDialog] = useState(false);
  const [recoveryDialog, setRecoveryDialog] = useState(false);
  const [devicesDialog, setDevicesDialog] = useState(false);

  const [emailInput, setEmailInput] = useState(settings.contactEmail);
  const [phoneInput, setPhoneInput] = useState(settings.phone);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [nextPasswordInput, setNextPasswordInput] = useState("");
  const [recoveryInput, setRecoveryInput] = useState(settings.security.recovery_email ?? "");

  useEffect(() => {
    setSettings(initialSettings);
    setEmailInput(initialSettings.contactEmail);
    setPhoneInput(initialSettings.phone);
    setRecoveryInput(initialSettings.security.recovery_email ?? "");
  }, [initialSettings]);

  const notify = useCallback(
    (tone: "ok" | "error", message: string) => {
      setFlash({ tone, message });
      window.setTimeout(() => setFlash(null), 3200);
    },
    []
  );

  const run = useCallback(
    (task: () => Promise<{ ok: boolean; error?: string } | void>) => {
      startTransition(async () => {
        try {
          const result = await task();
          if (result && "ok" in result && !result.ok) {
            notify("error", result.error ?? t.errorGeneric);
            return;
          }
          notify("ok", t.saved);
          router.refresh();
        } catch {
          notify("error", t.errorGeneric);
        }
      });
    },
    [notify, router, t.errorGeneric, t.saved]
  );

  const previewDevices = settings.devices.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {flash ? (
        <div
          className={cn(
            "fixed right-4 top-20 z-50 rounded-xl px-4 py-2 text-sm shadow-lg",
            flash.tone === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          )}
        >
          {flash.message}
        </div>
      ) : null}

      <Link
        href={withLocale("/studio/profile", locale)}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.back}
      </Link>

      <div className="mt-5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{t.title}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{t.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <SecurityCard title={t.loginInfo}>
          <div className="space-y-4">
            {[
              { icon: Mail, label: t.email, value: settings.contactEmail, onEdit: () => setEmailDialog(true) },
              {
                icon: Lock,
                label: t.password,
                value: "••••••••",
                onEdit: () => {
                  setCurrentPasswordInput("");
                  setNextPasswordInput("");
                  setPasswordDialog(true);
                }
              },
              {
                icon: Phone,
                label: t.phone,
                value: settings.phone,
                onEdit: () => {
                  setPhoneInput(settings.phone);
                  setPhoneDialog(true);
                }
              }
            ].map(({ icon: Icon, label, value, onEdit }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="truncate text-sm font-medium text-zinc-900">{value}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 shrink-0 rounded-lg px-3 text-xs" onClick={onEdit}>
                  {t.edit}
                </Button>
              </div>
            ))}
          </div>
        </SecurityCard>

        <SecurityCard
          title={t.twoFactor}
          badge={
            settings.twoFactorEnabled ? (
              <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                {t.twoFactorEnabled}
              </Badge>
            ) : (
              <Badge variant="secondary" className="rounded-full">
                {t.twoFactorDisabled}
              </Badge>
            )
          }
        >
          <div className="flex flex-1 flex-col">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="text-sm leading-6 text-zinc-600">
                {settings.twoFactorEnabled ? t.twoFactorOnHint : t.twoFactorOffHint}
              </p>
            </div>
            <div className="mt-auto pt-5">
              <Button
                variant="outline"
                className="w-full rounded-lg sm:w-auto"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const enabled = !settings.twoFactorEnabled;
                    const result = await toggleTwoFactorAction({ lang: locale, enabled });
                    if (result.ok) {
                      setSettings((prev) => ({ ...prev, twoFactorEnabled: enabled }));
                    }
                    return result;
                  })
                }
              >
                {settings.twoFactorEnabled ? t.manage2fa : t.enable2fa}
              </Button>
            </div>
          </div>
        </SecurityCard>

        <SecurityCard title={t.oauth}>
          <div className="space-y-3">
            {(["google", "apple", "facebook"] as OAuthProvider[]).map((provider) => {
              const connected = settings.oauth[provider];
              const name = provider === "google" ? "Google" : provider === "apple" ? "Apple" : "Facebook";
              const logo =
                provider === "google" ? (
                  <span className="text-sm font-bold text-[#4285F4]">G</span>
                ) : provider === "apple" ? (
                  <span className="text-sm font-semibold text-zinc-900"></span>
                ) : (
                  <span className="text-sm font-bold text-[#1877F2]">f</span>
                );
              return (
                <div key={provider} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 ring-1 ring-zinc-100">
                      {logo}
                    </span>
                    <span className="text-sm font-medium text-zinc-900">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs",
                        connected ? "text-emerald-600" : "text-zinc-400"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-zinc-300")} />
                      {connected ? t.connected : t.notConnected}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg px-2.5 text-xs"
                      disabled={pending}
                      onClick={() =>
                        run(async () => {
                          const next = !connected;
                          const result = await toggleOAuthAction({ lang: locale, provider, connected: next });
                          if (result.ok) {
                            setSettings((prev) => ({
                              ...prev,
                              oauth: { ...prev.oauth, [provider]: next }
                            }));
                          }
                          return result;
                        })
                      }
                    >
                      {connected ? t.disconnect : t.connect}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </SecurityCard>

        <SecurityCard title={t.devices}>
          {previewDevices.length === 0 ? (
            <p className="text-sm text-zinc-500">{t.noDevices}</p>
          ) : (
            <div className="space-y-3">
              {previewDevices.map((device) => {
                const Icon = deviceIcon(device);
                return (
                  <div key={device.id} className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">
                          {device.device_name}
                          {device.current ? (
                            <span className="ml-2 text-xs font-normal text-indigo-600">({t.currentDevice})</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {device.location} · {browserLabel(device)}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {formatRelativeTime(device.last_active_at, locale, t.now)}
                        </p>
                      </div>
                    </div>
                    {!device.current ? (
                      <button
                        type="button"
                        className="rounded-md p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
                        aria-label={t.revoke}
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            const result = await revokeDeviceAction({ lang: locale, deviceId: device.id });
                            if (result.ok) {
                              setSettings((prev) => ({
                                ...prev,
                                devices: prev.devices.filter((item) => item.id !== device.id)
                              }));
                            }
                            return result;
                          })
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => setDevicesDialog(true)}
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t.viewAllDevices} ({settings.devices.length || settings.loginHistory.length})
            <ChevronRight className="h-4 w-4" />
          </button>
        </SecurityCard>
      </div>

      <SecurityCard title={t.securitySettings} className="mt-5">
        <div className="divide-y divide-zinc-100">
          <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <p className="text-sm font-medium text-zinc-900">{t.loginAlerts}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.loginAlertsHint}</p>
            </div>
            <SettingsToggle
              label={t.loginAlerts}
              checked={settings.security.login_alerts}
              disabled={pending}
              onCheckedChange={(login_alerts) =>
                run(async () => {
                  const result = await updateSecurityPrefsAction({ lang: locale, login_alerts });
                  if (result.ok) {
                    setSettings((prev) => ({
                      ...prev,
                      security: { ...prev.security, login_alerts }
                    }));
                  }
                  return result;
                })
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-zinc-900">{t.suspiciousBlock}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.suspiciousBlockHint}</p>
            </div>
            <SettingsToggle
              label={t.suspiciousBlock}
              checked={settings.security.suspicious_login_block}
              disabled={pending}
              onCheckedChange={(suspicious_login_block) =>
                run(async () => {
                  const result = await updateSecurityPrefsAction({ lang: locale, suspicious_login_block });
                  if (result.ok) {
                    setSettings((prev) => ({
                      ...prev,
                      security: { ...prev.security, suspicious_login_block }
                    }));
                  }
                  return result;
                })
              }
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setRecoveryInput(settings.security.recovery_email ?? settings.contactEmail);
              setRecoveryDialog(true);
            }}
            className="flex w-full items-center justify-between gap-4 py-4 text-left"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900">{t.accountRecovery}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.accountRecoveryHint}</p>
              {settings.security.recovery_email ? (
                <p className="mt-1 text-xs text-zinc-400">{settings.security.recovery_email}</p>
              ) : null}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>
        </div>
      </SecurityCard>

      <Dialog open={devicesDialog} onOpenChange={setDevicesDialog}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.devices}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.devices}</h4>
              {settings.devices.length === 0 ? (
                <p className="text-sm text-zinc-500">{t.noDevices}</p>
              ) : (
                <div className="space-y-3">
                  {settings.devices.map((device) => {
                    const Icon = deviceIcon(device);
                    return (
                      <div key={device.id} className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 p-3">
                        <div className="flex gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              {device.device_name}
                              {device.current ? ` (${t.currentDevice})` : ""}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500">
                              {device.location} · {browserLabel(device)}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {formatRelativeTime(device.last_active_at, locale, t.now)}
                            </p>
                          </div>
                        </div>
                        {!device.current ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={pending}
                            onClick={() =>
                              run(async () => {
                                const result = await revokeDeviceAction({ lang: locale, deviceId: device.id });
                                if (result.ok) {
                                  setSettings((prev) => ({
                                    ...prev,
                                    devices: prev.devices.filter((item) => item.id !== device.id)
                                  }));
                                }
                                return result;
                              })
                            }
                          >
                            {t.revoke}
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.loginHistory}</h4>
              {settings.loginHistory.length === 0 ? (
                <p className="text-sm text-zinc-500">{t.noHistory}</p>
              ) : (
                <div className="space-y-3">
                  {settings.loginHistory.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-zinc-100 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-900">{entry.device}</p>
                        <span className={cn("text-xs", entry.success ? "text-emerald-600" : "text-red-600")}>
                          {entry.success ? t.success : t.failed}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-zinc-600">{entry.location}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {entry.ip} ·{" "}
                        {new Date(entry.at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.dialogEmail}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="contact-email">{t.email}</Label>
            <Input id="contact-email" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(false)}>
              {t.cancel}
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await updateContactEmailAction({ lang: locale, email: emailInput });
                  if (result.ok) {
                    setSettings((prev) => ({ ...prev, contactEmail: emailInput.trim() }));
                    setEmailDialog(false);
                  }
                  return result;
                })
              }
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.dialogPassword}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t.currentPassword}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t.newPassword}</Label>
              <Input
                id="new-password"
                type="password"
                value={nextPasswordInput}
                onChange={(e) => setNextPasswordInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(false)}>
              {t.cancel}
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await updatePasswordAction({
                    lang: locale,
                    currentPassword: currentPasswordInput,
                    nextPassword: nextPasswordInput
                  });
                  if (result.ok) {
                    setPasswordDialog(false);
                  }
                  return result;
                })
              }
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={phoneDialog} onOpenChange={setPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.dialogPhone}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="phone">{t.phone}</Label>
            <Input id="phone" type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhoneDialog(false)}>
              {t.cancel}
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await updatePhoneAction({ lang: locale, phone: phoneInput });
                  if (result.ok) {
                    setSettings((prev) => ({ ...prev, phone: phoneInput.trim() }));
                    setPhoneDialog(false);
                  }
                  return result;
                })
              }
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={recoveryDialog} onOpenChange={setRecoveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.dialogRecovery}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="recovery-email">{t.recoveryEmail}</Label>
            <Input
              id="recovery-email"
              type="email"
              value={recoveryInput}
              onChange={(e) => setRecoveryInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecoveryDialog(false)}>
              {t.cancel}
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = await updateSecurityPrefsAction({
                    lang: locale,
                    recovery_email: recoveryInput.trim() || null
                  });
                  if (result.ok) {
                    setSettings((prev) => ({
                      ...prev,
                      security: { ...prev.security, recovery_email: recoveryInput.trim() || null }
                    }));
                    setRecoveryDialog(false);
                  }
                  return result;
                })
              }
            >
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
