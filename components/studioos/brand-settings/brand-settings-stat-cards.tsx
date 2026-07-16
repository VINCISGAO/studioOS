"use client";

import type { BrandSettingsCopy } from "@/components/studioos/brand-settings/brand-settings-copy";
import type { CreatorSettingsViewModel } from "@/lib/studioos/creator-settings-types";
import type { Locale } from "@/lib/i18n";
import { formatSettingsRelativeTime } from "@/components/studioos/brand-settings/brand-settings-copy";
import { cn } from "@/lib/utils";
import { Bell, Clock, KeyRound, Lock, ShieldAlert } from "lucide-react";

type StatCard = {
  label: string;
  value: string;
  sub: string;
  icon: typeof Lock;
  iconTone: string;
};

export function BrandSettingsStatCards({
  locale,
  copy: t,
  settings,
  deviceCount
}: {
  locale: Locale;
  copy: BrandSettingsCopy;
  settings: CreatorSettingsViewModel;
  deviceCount: number;
}) {
  const securityTipCount = settings.twoFactorEnabled ? 0 : 1;
  const recentEntry = settings.loginHistory[0];
  const recentDevice = settings.devices.find((d) => d.current) ?? settings.devices[0];
  const recentAt = recentDevice?.last_active_at ?? recentEntry?.at;
  const recentLocation =
    recentDevice?.location ?? recentEntry?.location ?? (locale === "zh" ? "未知地区" : "Unknown");

  const cards: StatCard[] = [
    {
      label: t.statLoginDevices,
      value: String(deviceCount),
      sub: t.statTrustedDevices,
      icon: Lock,
      iconTone: "bg-violet-100 text-violet-600"
    },
    {
      label: t.statSecurityTips,
      value: String(securityTipCount),
      sub: t.statNeedsAction,
      icon: ShieldAlert,
      iconTone: "bg-sky-100 text-sky-600"
    },
    {
      label: t.statLoginAlerts,
      value: settings.security.login_alerts ? t.enabled : t.disabled,
      sub: t.statRealtimeNotify,
      icon: Bell,
      iconTone: "bg-orange-100 text-orange-500"
    },
    {
      label: t.statTwoFactor,
      value: settings.twoFactorEnabled ? t.enabled : t.disabled,
      sub: t.statBoostSecurity,
      icon: KeyRound,
      iconTone: "bg-emerald-100 text-emerald-600"
    },
    {
      label: t.statRecentLogin,
      value: recentAt ? formatSettingsRelativeTime(recentAt, locale, t.now) : t.statJustNow,
      sub: recentLocation,
      icon: Clock,
      iconTone: "bg-violet-100 text-violet-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex min-h-[118px] flex-col rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", card.iconTone)}>
              <card.icon className="h-4 w-4" />
            </span>
            <p className="truncate text-xs text-zinc-500">{card.label}</p>
          </div>
          <p className="mt-3 text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">{card.value}</p>
          <p className="mt-auto pt-2 text-xs text-zinc-400">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
