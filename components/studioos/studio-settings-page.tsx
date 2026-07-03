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
import { CreatorPricingPreferenceCard } from "@/components/studioos/creator-pricing-preference-card";
import { StudioSettingsBoard } from "@/components/studioos/studio-settings/studio-settings-board";
import { StudioSettingsDialogs } from "@/components/studioos/studio-settings/studio-settings-dialogs";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { CreatorSettingsViewModel, OAuthProvider } from "@/lib/studioos/creator-settings-types";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

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
    viewAllDevices: "View all devices",
    noDevices: "No devices yet. Sign in again to record this device.",
    securitySettings: "Security settings",
    loginAlerts: "Login alerts",
    loginAlertsHint: "Email me when a new device signs in.",
    suspiciousBlock: "Suspicious login blocking",
    suspiciousBlockHint: "Lock the account and notify me when suspicious sign-in is detected.",
    accountRecovery: "Account recovery",
    accountRecoveryHint: "Set a recovery email to regain access if you cannot sign in."
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
    twoFactorOffHint: "开启后，登录时需要输入验证码，为您的账户增加一层保护。",
    manage2fa: "管理验证方式",
    enable2fa: "开启两步验证",
    oauth: "第三方登录",
    connected: "已连接",
    notConnected: "未连接",
    connect: "连接",
    disconnect: "断开",
    devices: "登录设备",
    viewAllDevices: "查看所有设备",
    noDevices: "暂无设备记录，重新登录后将自动记录。",
    securitySettings: "安全设置",
    loginAlerts: "登录提醒",
    loginAlertsHint: "当有新设备登录时，通过邮件通知我。",
    suspiciousBlock: "可疑登录拦截",
    suspiciousBlockHint: "检测到可疑登录时，自动锁定账户并通知我。",
    accountRecovery: "账户恢复",
    accountRecoveryHint: "设置账户恢复方式，以便在无法登录时找回账户。"
  }
} as const;

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

  const notify = useCallback((tone: "ok" | "error", message: string) => {
    setFlash({ tone, message });
    window.setTimeout(() => setFlash(null), 3200);
  }, []);

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

  const deviceCount = settings.devices.length || settings.loginHistory.length;

  return (
    <div className="space-y-6">
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

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{t.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
      </header>

      <StudioSettingsBoard
        copy={t}
        settings={settings}
        pending={pending}
        deviceCount={deviceCount}
        onEditEmail={() => setEmailDialog(true)}
        onEditPassword={() => {
          setCurrentPasswordInput("");
          setNextPasswordInput("");
          setPasswordDialog(true);
        }}
        onEditPhone={() => {
          setPhoneInput(settings.phone);
          setPhoneDialog(true);
        }}
        onToggleTwoFactor={() =>
          run(async () => {
            const enabled = !settings.twoFactorEnabled;
            const result = await toggleTwoFactorAction({ lang: locale, enabled });
            if (result.ok) {
              setSettings((prev) => ({ ...prev, twoFactorEnabled: enabled }));
            }
            return result;
          })
        }
        onToggleOAuth={(provider: OAuthProvider, connected: boolean) =>
          run(async () => {
            const result = await toggleOAuthAction({ lang: locale, provider, connected });
            if (result.ok) {
              setSettings((prev) => ({
                ...prev,
                oauth: { ...prev.oauth, [provider]: connected }
              }));
            }
            return result;
          })
        }
        onOpenDevices={() => setDevicesDialog(true)}
        onToggleLoginAlerts={(login_alerts) =>
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
        onToggleSuspiciousBlock={(suspicious_login_block) =>
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
        onOpenRecovery={() => {
          setRecoveryInput(settings.security.recovery_email ?? settings.contactEmail);
          setRecoveryDialog(true);
        }}
      />

      <CreatorPricingPreferenceCard locale={locale} settings={settings} />

      <StudioSettingsDialogs
        locale={locale}
        settings={settings}
        pending={pending}
        emailDialog={emailDialog}
        setEmailDialog={setEmailDialog}
        passwordDialog={passwordDialog}
        setPasswordDialog={setPasswordDialog}
        phoneDialog={phoneDialog}
        setPhoneDialog={setPhoneDialog}
        recoveryDialog={recoveryDialog}
        setRecoveryDialog={setRecoveryDialog}
        devicesDialog={devicesDialog}
        setDevicesDialog={setDevicesDialog}
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        phoneInput={phoneInput}
        setPhoneInput={setPhoneInput}
        currentPasswordInput={currentPasswordInput}
        setCurrentPasswordInput={setCurrentPasswordInput}
        nextPasswordInput={nextPasswordInput}
        setNextPasswordInput={setNextPasswordInput}
        recoveryInput={recoveryInput}
        setRecoveryInput={setRecoveryInput}
        onSaveEmail={() =>
          run(async () => {
            const result = await updateContactEmailAction({ lang: locale, email: emailInput });
            if (result.ok) {
              setSettings((prev) => ({ ...prev, contactEmail: emailInput.trim() }));
              setEmailDialog(false);
            }
            return result;
          })
        }
        onSavePassword={() =>
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
        onSavePhone={() =>
          run(async () => {
            const result = await updatePhoneAction({ lang: locale, phone: phoneInput });
            if (result.ok) {
              setSettings((prev) => ({ ...prev, phone: phoneInput.trim() }));
              setPhoneDialog(false);
            }
            return result;
          })
        }
        onSaveRecovery={() =>
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
        onRevokeDevice={(deviceId) =>
          run(async () => {
            const result = await revokeDeviceAction({ lang: locale, deviceId });
            if (result.ok) {
              setSettings((prev) => ({
                ...prev,
                devices: prev.devices.filter((item) => item.id !== deviceId)
              }));
            }
            return result;
          })
        }
      />
    </div>
  );
}
