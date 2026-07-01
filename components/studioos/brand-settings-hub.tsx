"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn } from "@/lib/utils";
import { KeyRound, Shield, Trash2, UserRound } from "lucide-react";

type Tab = "profile" | "security" | "api" | "delete";

const tabs: { id: Tab; icon: typeof UserRound; label: { en: string; zh: string } }[] = [
  { id: "profile", icon: UserRound, label: { en: "Basic info", zh: "基本信息" } },
  { id: "security", icon: Shield, label: { en: "Login security", zh: "登录安全" } },
  { id: "api", icon: KeyRound, label: { en: "API", zh: "API" } },
  { id: "delete", icon: Trash2, label: { en: "Delete account", zh: "注销账号" } }
];

const copy = {
  en: {
    title: "Account settings",
    subtitle: "Profile, security, API access, and account deletion.",
    profileBody: "Company name, contact email, and billing contact will be managed here.",
    securityBody: "Password, two-factor authentication, and active sessions.",
    apiBody: "Programmatic access for reporting and automation — coming soon.",
    deleteBody: "Permanently close your advertiser account and archive active campaigns.",
    soon: "Coming soon"
  },
  zh: {
    title: "账号设置",
    subtitle: "基本信息、登录安全、API 与账号注销。",
    profileBody: "公司名称、联系邮箱与账单联系人将在这里管理。",
    securityBody: "密码、双重验证与登录设备。",
    apiBody: "用于报表与自动化的 API 访问 — 即将上线。",
    deleteBody: "永久关闭广告主账号并归档进行中的广告。",
    soon: "即将上线"
  }
};

export function BrandSettingsHub({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as Tab) || "profile";
  const safeTab = tabs.some((tab) => tab.id === active) ? active : "profile";

  const body =
    safeTab === "security"
      ? t.securityBody
      : safeTab === "api"
        ? t.apiBody
        : safeTab === "delete"
          ? t.deleteBody
          : t.profileBody;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{t.title}</h1>
        <p className={cn("mt-2 max-w-2xl", portalChrome.body)}>{t.subtitle}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = safeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={withLocale(`${brandPortalRoutes.settings}?tab=${tab.id}`, locale)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  selected
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900 lg:ring-0 lg:hover:bg-zinc-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label[locale]}
              </Link>
            );
          })}
        </nav>

        <Card className="border-zinc-200/80 shadow-none">
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-zinc-950">{tabs.find((tab) => tab.id === safeTab)?.label[locale]}</h2>
            <p className={cn("mt-2 max-w-xl", portalChrome.body)}>{body}</p>
            <p className="mt-6 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {t.soon}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
