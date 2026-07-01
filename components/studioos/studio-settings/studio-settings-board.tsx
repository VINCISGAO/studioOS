"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  OAuthBrandMark,
  SecurityCard,
  SettingsToggle,
  TwoFactorIllustration
} from "@/components/studioos/studio-settings/studio-settings-ui";
import type { CreatorSettingsViewModel, OAuthProvider } from "@/lib/studioos/creator-settings-types";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronRight,
  Link2,
  Lock,
  Mail,
  Monitor,
  Phone,
  RotateCcw,
  ShieldCheck
} from "lucide-react";

type SettingsCopy = {
  loginInfo: string;
  email: string;
  password: string;
  phone: string;
  edit: string;
  twoFactor: string;
  twoFactorEnabled: string;
  twoFactorDisabled: string;
  twoFactorOnHint: string;
  twoFactorOffHint: string;
  manage2fa: string;
  enable2fa: string;
  oauth: string;
  connected: string;
  notConnected: string;
  connect: string;
  disconnect: string;
  devices: string;
  viewAllDevices: string;
  noDevices: string;
  securitySettings: string;
  loginAlerts: string;
  loginAlertsHint: string;
  suspiciousBlock: string;
  suspiciousBlockHint: string;
  accountRecovery: string;
  accountRecoveryHint: string;
};

export function StudioSettingsBoard({
  copy: t,
  settings,
  pending,
  deviceCount,
  onEditEmail,
  onEditPassword,
  onEditPhone,
  onToggleTwoFactor,
  onToggleOAuth,
  onOpenDevices,
  onToggleLoginAlerts,
  onToggleSuspiciousBlock,
  onOpenRecovery
}: {
  copy: SettingsCopy;
  settings: CreatorSettingsViewModel;
  pending: boolean;
  deviceCount: number;
  onEditEmail: () => void;
  onEditPassword: () => void;
  onEditPhone: () => void;
  onToggleTwoFactor: () => void;
  onToggleOAuth: (provider: OAuthProvider, connected: boolean) => void;
  onOpenDevices: () => void;
  onToggleLoginAlerts: (enabled: boolean) => void;
  onToggleSuspiciousBlock: (enabled: boolean) => void;
  onOpenRecovery: () => void;
}) {
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <SecurityCard title={t.loginInfo} icon={<Lock className="h-4 w-4" />} iconTone="bg-violet-50 text-violet-600">
          <div className="divide-y divide-zinc-100">
            {[
              { icon: Mail, label: t.email, value: settings.contactEmail, onEdit: onEditEmail },
              { icon: Lock, label: t.password, value: "••••••••", onEdit: onEditPassword },
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
          bodyClassName="items-center text-center"
        >
          {settings.twoFactorEnabled ? (
            <p className="text-sm leading-6 text-zinc-600">{t.twoFactorOnHint}</p>
          ) : (
            <>
              <TwoFactorIllustration />
              <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-500">{t.twoFactorOffHint}</p>
            </>
          )}
          <Button
            className={cn(
              "mt-5 rounded-xl px-6",
              settings.twoFactorEnabled ? "border-zinc-200" : "bg-violet-600 text-white hover:bg-violet-700"
            )}
            variant={settings.twoFactorEnabled ? "outline" : "default"}
            disabled={pending}
            onClick={onToggleTwoFactor}
          >
            {settings.twoFactorEnabled ? t.manage2fa : t.enable2fa}
          </Button>
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

        <SecurityCard
          title={t.devices}
          icon={<Monitor className="h-4 w-4" />}
          iconTone="bg-sky-50 text-sky-600"
          bodyClassName="min-h-[220px]"
        >
          <div className="flex flex-1 flex-col">
            <p className="flex flex-1 items-center justify-center text-center text-sm leading-6 text-zinc-500">
              {settings.devices.length === 0 ? t.noDevices : settings.devices[0]?.device_name}
            </p>
            <button
              type="button"
              onClick={onOpenDevices}
              className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              {t.viewAllDevices} ({deviceCount})
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </SecurityCard>
      </div>

      <SecurityCard
        title={t.securitySettings}
        icon={<ShieldCheck className="h-4 w-4" />}
        iconTone="bg-orange-50 text-orange-500"
        className="mt-5"
      >
        <div className="divide-y divide-zinc-100">
          <div className="flex items-center gap-4 py-4 first:pt-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900">{t.loginAlerts}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.loginAlertsHint}</p>
            </div>
            <SettingsToggle
              label={t.loginAlerts}
              checked={settings.security.login_alerts}
              disabled={pending}
              onCheckedChange={onToggleLoginAlerts}
            />
          </div>
          <div className="flex items-center gap-4 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Lock className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900">{t.suspiciousBlock}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.suspiciousBlockHint}</p>
            </div>
            <SettingsToggle
              label={t.suspiciousBlock}
              checked={settings.security.suspicious_login_block}
              disabled={pending}
              onCheckedChange={onToggleSuspiciousBlock}
            />
          </div>
          <button type="button" onClick={onOpenRecovery} className="flex w-full items-center gap-4 py-4 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900">{t.accountRecovery}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.accountRecoveryHint}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>
        </div>
      </SecurityCard>
    </>
  );
}
