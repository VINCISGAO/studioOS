"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  revokeBrandDeviceAction,
  toggleBrandOAuthAction,
  toggleBrandTwoFactorAction,
  updateBrandContactEmailAction,
  updateBrandPhoneAction,
  updateBrandSecurityPrefsAction
} from "@/app/brand-settings-actions";
import { BrandSettingsBoard } from "@/components/studioos/brand-settings/brand-settings-board";
import { BrandSettingsShieldIllustration } from "@/components/studioos/brand-settings/brand-settings-art";
import { brandSettingsCopy } from "@/components/studioos/brand-settings/brand-settings-copy";
import { BrandSettingsStatCards } from "@/components/studioos/brand-settings/brand-settings-stat-cards";
import { StudioSettingsDialogs } from "@/components/studioos/studio-settings/studio-settings-dialogs";
import type { Locale } from "@/lib/i18n";
import type { CreatorSettingsViewModel, OAuthProvider } from "@/lib/studioos/creator-settings-types";
import { cn } from "@/lib/utils";

export function BrandSettingsHub({
  locale,
  settings: initialSettings
}: {
  locale: Locale;
  settings: CreatorSettingsViewModel;
}) {
  const t = brandSettingsCopy[locale];
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const { pending, feedback, run: runAction } = useAsyncAction({
    okMessage: t.saved,
    errorMessage: t.errorGeneric
  });
  const [emailDialog, setEmailDialog] = useState(false);
  const [phoneDialog, setPhoneDialog] = useState(false);
  const [recoveryDialog, setRecoveryDialog] = useState(false);
  const [devicesDialog, setDevicesDialog] = useState(false);
  const [emailInput, setEmailInput] = useState(settings.contactEmail);
  const [phoneInput, setPhoneInput] = useState(settings.phone);
  const [recoveryInput, setRecoveryInput] = useState(settings.security.recovery_email ?? "");

  useEffect(() => {
    setSettings(initialSettings);
    setEmailInput(initialSettings.contactEmail);
    setPhoneInput(initialSettings.phone);
    setRecoveryInput(initialSettings.security.recovery_email ?? "");
  }, [initialSettings]);

  const run = useCallback(
    (task: () => Promise<{ ok: boolean; error?: string } | void>) =>
      runAction(async () => {
        const result = await task();
        if (!result || ("ok" in result && result.ok)) {
          router.refresh();
        }
        return result;
      }),
    [runAction, router]
  );

  const deviceCount = settings.devices.length || settings.loginHistory.length;

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          className={cn(
            "fixed right-4 top-20 z-50 rounded-xl px-4 py-2 text-sm shadow-lg",
            feedback.tone === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          )}
          role="status"
        >
          {feedback.message}
        </div>
      ) : null}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px]">{t.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-[15px]">{t.subtitle}</p>
        </div>
        <BrandSettingsShieldIllustration className="mx-auto h-28 w-36 shrink-0 sm:mx-0 sm:h-32 sm:w-44" />
      </header>

      <BrandSettingsStatCards locale={locale} copy={t} settings={settings} deviceCount={deviceCount} />

      <BrandSettingsBoard
        locale={locale}
        copy={t}
        settings={settings}
        pending={pending}
        deviceCount={deviceCount}
        onEditEmail={() => setEmailDialog(true)}
        onEditPhone={() => {
          setPhoneInput(settings.phone);
          setPhoneDialog(true);
        }}
        onToggleTwoFactor={() =>
          run(async () => {
            const enabled = !settings.twoFactorEnabled;
            const result = await toggleBrandTwoFactorAction({ lang: locale, enabled });
            if (result.ok) {
              setSettings((prev) => ({ ...prev, twoFactorEnabled: enabled }));
            }
            return result;
          })
        }
        onToggleOAuth={(provider: OAuthProvider, connected: boolean) =>
          run(async () => {
            const result = await toggleBrandOAuthAction({ lang: locale, provider, connected });
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
            const result = await updateBrandSecurityPrefsAction({ lang: locale, login_alerts });
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
            const result = await updateBrandSecurityPrefsAction({ lang: locale, suspicious_login_block });
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

      <StudioSettingsDialogs
        locale={locale}
        settings={settings}
        pending={pending}
        emailDialog={emailDialog}
        setEmailDialog={setEmailDialog}
        passwordDialog={false}
        setPasswordDialog={() => {}}
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
        currentPasswordInput=""
        setCurrentPasswordInput={() => {}}
        nextPasswordInput=""
        setNextPasswordInput={() => {}}
        recoveryInput={recoveryInput}
        setRecoveryInput={setRecoveryInput}
        onSaveEmail={() =>
          run(async () => {
            const result = await updateBrandContactEmailAction({ lang: locale, email: emailInput });
            if (result.ok) {
              setSettings((prev) => ({ ...prev, contactEmail: emailInput.trim() }));
              setEmailDialog(false);
            }
            return result;
          })
        }
        onSavePassword={async () => ({ ok: true })}
        onSavePhone={() =>
          run(async () => {
            const result = await updateBrandPhoneAction({ lang: locale, phone: phoneInput });
            if (result.ok) {
              setSettings((prev) => ({ ...prev, phone: phoneInput.trim() }));
              setPhoneDialog(false);
            }
            return result;
          })
        }
        onSaveRecovery={() =>
          run(async () => {
            const result = await updateBrandSecurityPrefsAction({
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
            const result = await revokeBrandDeviceAction({ lang: locale, deviceId });
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
