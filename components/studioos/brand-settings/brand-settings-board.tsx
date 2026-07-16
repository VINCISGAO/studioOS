"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BrandSettingsTwoFactorIllustration
} from "@/components/studioos/brand-settings/brand-settings-art";
import {
  formatSettingsRelativeTime,
  type BrandSettingsCopy
} from "@/components/studioos/brand-settings/brand-settings-copy";
import {
  OAuthBrandMark,
  SecurityCard,
  SettingsToggle
} from "@/components/studioos/studio-settings/studio-settings-ui";
import type { CreatorSettingsViewModel, LoginDevice, OAuthProvider } from "@/lib/studioos/creator-settings-types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronRight,
  Clock,
  Link2,
  Laptop,
  Mail,
  Monitor,
  Phone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserRound
} from "lucide-react";

function deviceIcon(device: LoginDevice) {
  if (device.os === "iOS" || device.device_name.includes("iPhone")) return Smartphone;
  if (device.os === "macOS" || device.device_name.includes("Mac")) return Laptop;
  return Monitor;
}

function browserLabel(device: LoginDevice) {
  return device.browser_version ? `${device.browser} ${device.browser_version}` : device.browser;
}

export function BrandSettingsBoard({
  locale,
  copy: t,
  settings,
  pending,
  deviceCount,
  onEditEmail,
  onEditPhone,
  onToggleTwoFactor,
  onToggleOAuth,
  onOpenDevices,
  onToggleLoginAlerts,
  onToggleSuspiciousBlock,
  onOpenRecovery
}: {
  locale: Locale;
  copy: BrandSettingsCopy;
  settings: CreatorSettingsViewModel;
  pending: boolean;
  deviceCount: number;
  onEditEmail: () => void;
  onEditPhone: () => void;
  onToggleTwoFactor: () => void;
  onToggleOAuth: (provider: OAuthProvider, connected: boolean) => void;
  onOpenDevices: () => void;
  onToggleLoginAlerts: (enabled: boolean) => void;
  onToggleSuspiciousBlock: (enabled: boolean) => void;
  onOpenRecovery: () => void;
}) {
  const previewDevices = settings.devices.slice(0, 2);

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <SecurityCard
            title={t.loginInfo}
            icon={<UserRound className="h-4 w-4" />}
            iconTone="bg-violet-50 text-violet-600"
          >
            <div className="divide-y divide-zinc-100">
              {[
                { icon: Mail, label: t.email, value: settings.contactEmail, onEdit: onEditEmail },
                { icon: Phone, label: t.phone, value: settings.phone, onEdit: onEditPhone }
              ].map(({ icon: Icon, label, value, onEdit }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">{label}</p>
                      <p className="truncate text-sm font-medium text-zinc-900">{value}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-lg border-zinc-200 px-3 text-xs font-medium"
                    onClick={onEdit}
                  >
                    {t.edit}
                  </Button>
                </div>
              ))}
            </div>
          </SecurityCard>

          <SecurityCard title={t.oauth} icon={<Link2 className="h-4 w-4" />} iconTone="bg-emerald-50 text-emerald-600">
            <div className="divide-y divide-zinc-100">
              {(["google", "apple", "facebook"] as OAuthProvider[]).map((provider) => {
                const connected = settings.oauth[provider];
                const name = provider === "google" ? "Google" : provider === "apple" ? "Apple" : "Facebook";
                return (
                  <div key={provider} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                    <OAuthBrandMark provider={provider} />
                    <span className="min-w-[72px] text-sm font-medium text-zinc-900">{name}</span>
                    <span
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 text-xs",
                        connected ? "text-emerald-600" : "text-zinc-400"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-zinc-300")} />
                      {connected ? t.connected : t.notConnected}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-zinc-200 px-3 text-xs"
                      disabled={pending}
                      onClick={() => onToggleOAuth(provider, !connected)}
                    >
                      {connected ? t.disconnect : t.connect}
                    </Button>
                  </div>
                );
              })}
            </div>
          </SecurityCard>
        </div>

        <div className="space-y-5">
          <SecurityCard
            title={t.twoFactor}
            icon={<ShieldCheck className="h-4 w-4" />}
            iconTone="bg-sky-50 text-sky-600"
            badge={
              settings.twoFactorEnabled ? (
                <Badge className="rounded-full bg-emerald-50 px-2.5 text-emerald-700 hover:bg-emerald-50">
                  {t.twoFactorEnabled}
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full bg-zinc-100 px-2.5 text-zinc-500 hover:bg-zinc-100">
                  {t.twoFactorDisabled}
                </Badge>
              )
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6 text-zinc-500">
                  {settings.twoFactorEnabled ? t.twoFactorOnHint : t.twoFactorOffHint}
                </p>
                <Button
                  className={cn(
                    "mt-4 rounded-xl px-6",
                    settings.twoFactorEnabled
                      ? "border-zinc-200"
                      : "bg-violet-600 text-white hover:bg-violet-700"
                  )}
                  variant={settings.twoFactorEnabled ? "outline" : "default"}
                  disabled={pending}
                  onClick={onToggleTwoFactor}
                >
                  {settings.twoFactorEnabled ? t.manage2fa : t.enable2fa}
                </Button>
              </div>
              {!settings.twoFactorEnabled ? (
                <BrandSettingsTwoFactorIllustration className="mx-auto h-24 w-28 shrink-0 sm:mx-0 sm:h-28 sm:w-32" />
              ) : null}
            </div>
          </SecurityCard>

          <SecurityCard
            title={t.devices}
            subtitle={t.devicesSubtitle}
            icon={<Clock className="h-4 w-4" />}
            iconTone="bg-sky-50 text-sky-600"
          >
            <div className="flex flex-1 flex-col">
              {previewDevices.length === 0 ? (
                <p className="py-6 text-center text-sm leading-6 text-zinc-500">{t.noDevices}</p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {previewDevices.map((device) => {
                    const Icon = deviceIcon(device);
                    return (
                      <button
                        key={device.id}
                        type="button"
                        onClick={onOpenDevices}
                        className="flex w-full items-center gap-3 py-4 text-left first:pt-0 last:pb-0"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-zinc-900">{device.device_name}</p>
                            {device.current ? (
                              <Badge className="rounded-full bg-violet-50 px-2 py-0 text-[10px] text-violet-700 hover:bg-violet-50">
                                {t.currentDevice}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {browserLabel(device)} · {device.os} · {device.location}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {formatSettingsRelativeTime(device.last_active_at, locale, t.now)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={onOpenDevices}
                className="mt-2 inline-flex items-center gap-1 pt-2 text-sm font-medium text-violet-600 hover:text-violet-700"
              >
                {t.viewAllDevices} ({deviceCount})
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </SecurityCard>
        </div>
      </div>

      <SecurityCard
        title={t.securitySettings}
        icon={<ShieldCheck className="h-4 w-4" />}
        iconTone="bg-violet-50 text-violet-600"
        className="mt-5"
      >
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="flex items-start gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-900">{t.loginAlerts}</p>
                <SettingsToggle
                  label={t.loginAlerts}
                  checked={settings.security.login_alerts}
                  disabled={pending}
                  onCheckedChange={onToggleLoginAlerts}
                />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.loginAlertsHint}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-900">{t.suspiciousBlock}</p>
                <SettingsToggle
                  label={t.suspiciousBlock}
                  checked={settings.security.suspicious_login_block}
                  disabled={pending}
                  onCheckedChange={onToggleSuspiciousBlock}
                />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.suspiciousBlockHint}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRecovery}
            className="flex items-start gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4 text-left transition hover:border-zinc-200"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-900">{t.accountRecovery}</p>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.accountRecoveryHint}</p>
            </div>
          </button>
        </div>
      </SecurityCard>
    </>
  );
}
