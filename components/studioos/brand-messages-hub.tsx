"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BrandNotificationList } from "@/components/studioos/brand-notification-list";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import type { BrandNotification } from "@/lib/studioos/brand-notification-types";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn } from "@/lib/utils";
import { Bell, Inbox, MessageSquare } from "lucide-react";

type Tab = "project" | "system" | "direct";

const tabs: { id: Tab; icon: typeof Bell; label: { en: string; zh: string } }[] = [
  { id: "project", icon: Bell, label: { en: "Project notifications", zh: "项目通知" } },
  { id: "system", icon: Inbox, label: { en: "System notifications", zh: "系统通知" } },
  { id: "direct", icon: MessageSquare, label: { en: "Direct messages", zh: "私信消息" } }
];

const copy = {
  en: {
    title: "Messages",
    subtitle: "Project updates, platform alerts, and creator conversations.",
    emptyProject: "Creator responses, review uploads, and resolved notes appear here.",
    emptySystem: "Billing, security, and platform announcements will show here.",
    emptyDirect: "Direct messages with creators will appear in this inbox.",
    back: "Back to home",
    unread: "New"
  },
  zh: {
    title: "消息中心",
    subtitle: "项目动态、平台提醒与创作者私信。",
    emptyProject: "创作者接受/拒绝、上传审片、处理批注等互动通知都会显示在这里。",
    emptySystem: "账单、安全与平台公告会显示在这里。",
    emptyDirect: "与创作者的私信会话会显示在这里。",
    back: "返回首页",
    unread: "新"
  }
};

export function BrandMessagesHub({
  locale,
  projectNotifications = []
}: {
  locale: Locale;
  projectNotifications?: BrandNotification[];
}) {
  const t = copy[locale];
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as Tab) || "project";
  const safeTab = tabs.some((tab) => tab.id === active) ? active : "project";

  const emptyMessage = useMemo(() => {
    if (safeTab === "system") return t.emptySystem;
    if (safeTab === "direct") return t.emptyDirect;
    return t.emptyProject;
  }, [safeTab, t]);

  const visibleProjectNotifications = safeTab === "project" ? projectNotifications : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{t.title}</h1>
        <p className={cn("mt-2 max-w-2xl", portalChrome.body)}>{t.subtitle}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = safeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={withLocale(`${brandPortalRoutes.messages}?tab=${tab.id}`, locale)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition",
                selected ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label[locale]}
            </Link>
          );
        })}
      </div>

      {visibleProjectNotifications.length ? (
        <BrandNotificationList locale={locale} notifications={visibleProjectNotifications} />
      ) : (
        <section className={cn(portalChrome.card, "flex flex-col items-center px-6 py-16 text-center")}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
            <MessageSquare className="h-6 w-6" />
          </span>
          <p className={cn("mt-4 max-w-md", portalChrome.body)}>{emptyMessage}</p>
          <Link href={withLocale(brandPortalRoutes.dashboard, locale)} className="mt-4 text-sm font-medium text-zinc-900 hover:underline">
            {t.back}
          </Link>
        </section>
      )}
    </div>
  );
}
