import Link from "next/link";
import { ArrowRight, Bell, Megaphone, Plus } from "lucide-react";
import { BrandNotificationList } from "@/components/studioos/brand-notification-list";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { BrandProjectRow } from "@/lib/studioos/brand-dashboard";
import type { BrandDashboardMetrics } from "@/lib/studioos/brand-dashboard";
import type { BrandNotification } from "@/lib/studioos/brand-notification-types";
import {
  brandAdLifecycleBucket,
  brandAdLifecycleLabels,
  brandPendingActionRows,
  countBrandRowsByLifecycle
} from "@/lib/studioos/brand-lifecycle";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn, formatDate } from "@/lib/utils";

type Props = {
  locale: Locale;
  name: string;
  rows: BrandProjectRow[];
  metrics: BrandDashboardMetrics;
  notifications?: BrandNotification[];
};

const copy = {
  en: {
    greeting: (name: string) => `Welcome back, ${name}`,
    sub: "Manage your ad lifecycle from one place.",
    myProjects: "My projects",
    viewAll: "View all",
    pending: "Pending actions",
    pendingEmpty: "Nothing needs your attention right now.",
    messages: "Recent messages",
    messagesEmpty: "Project and system notifications will appear here.",
    quickPublish: "Quick publish",
    quickPublishBody: "Describe your ad needs and recruit creators in minutes.",
    overview: "Overview",
    statActive: "In progress",
    statDraft: "Drafts",
    statDelivered: "Delivered",
    statSpend: "Spend this month"
  },
  zh: {
    greeting: (name: string) => `${name}，欢迎回来`,
    sub: "在一个面板里管理广告全生命周期。",
    myProjects: "我的项目",
    viewAll: "查看全部",
    pending: "待处理事项",
    pendingEmpty: "目前没有需要你处理的事项。",
    messages: "最近消息",
    messagesEmpty: "项目通知和系统消息会显示在这里。",
    quickPublish: "快速发布广告",
    quickPublishBody: "填写广告需求，几分钟内开始招募创作者。",
    overview: "数据概览",
    statActive: "进行中",
    statDraft: "草稿",
    statDelivered: "已交付",
    statSpend: "本月支出"
  }
};

export function BrandHomeDashboard({ locale, name, rows, metrics, notifications = [] }: Props) {
  const t = copy[locale];
  const lifecycleCounts = countBrandRowsByLifecycle(rows);
  const pending = brandPendingActionRows(rows).slice(0, 4);
  const recentProjects = rows.slice(0, 5);
  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className={cn(portalChrome.card, "overflow-hidden")}>
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="border-b border-zinc-100 p-8 sm:p-10 lg:border-b-0 lg:border-r">
            <p className={portalChrome.eyebrow}>{locale === "zh" ? "品牌方后台" : "Brand workspace"}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">{t.greeting(name)}</h1>
            <p className={cn("mt-2 max-w-lg", portalChrome.body)}>{t.sub}</p>
            <BrandStartBriefButton locale={locale} size="lg" className={cn("mt-6", portalChrome.cta, "h-11 px-6")}>
              <Plus className="h-4 w-4" />
              {t.quickPublish}
              <ArrowRight className="h-4 w-4" />
            </BrandStartBriefButton>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 bg-zinc-50/80 lg:w-[280px] lg:grid-cols-1 lg:divide-x-0">
            {[
              { label: t.statDraft, value: lifecycleCounts.draft },
              { label: t.statActive, value: lifecycleCounts.recruiting + lifecycleCounts.in_production + lifecycleCounts.pending_review },
              { label: t.statDelivered, value: lifecycleCounts.completed },
              { label: t.statSpend, value: `$${Math.round(metrics.monthSpend).toLocaleString()}` }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col justify-center px-6 py-5 lg:px-8">
                <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cn(portalChrome.card, "p-5 sm:p-6")}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-950">{t.myProjects}</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-lg text-zinc-600">
              <Link href={withLocale(`${brandPortalRoutes.dashboard}#my-ads`, locale)}>
                {t.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {recentProjects.length ? (
            <ul className="divide-y divide-zinc-100">
              {recentProjects.map((row) => (
                <li key={`${row.kind}-${row.id}`}>
                  <Link
                    href={withLocale(
                      row.kind === "campaign" ? brandPortalRoutes.campaign(row.id) : row.href,
                      locale
                    )}
                    className="flex items-center justify-between gap-3 py-3 transition hover:text-zinc-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-950">{row.name}</p>
                      <p className="text-xs text-zinc-500">{formatDate(row.updatedAt)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={portalChrome.body}>{locale === "zh" ? "还没有广告项目" : "No ad projects yet"}</p>
          )}
        </section>

        <section className={cn(portalChrome.card, "p-5 sm:p-6")}>
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-500" />
            <h2 className="text-lg font-semibold text-zinc-950">{t.pending}</h2>
          </div>
          {pending.length ? (
            <ul className="space-y-3">
              {pending.map((row) => (
                <li key={`${row.kind}-${row.id}`}>
                  <Link
                    href={withLocale(
                      row.kind === "campaign" ? brandPortalRoutes.campaign(row.id) : row.href,
                      locale
                    )}
                    className="block rounded-xl border border-zinc-200/80 px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-50/50"
                  >
                    <p className="font-medium text-zinc-950">{row.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {brandAdLifecycleLabels[locale][brandAdLifecycleBucket(String(row.status))]}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={portalChrome.body}>{t.pendingEmpty}</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className={cn(portalChrome.card, "p-5 sm:p-6")}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-950">{t.messages}</h2>
            <Button asChild variant="ghost" size="sm" className="rounded-lg text-zinc-600">
              <Link href={withLocale(brandPortalRoutes.messages, locale)}>
                {t.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {recentNotifications.length ? (
            <BrandNotificationList locale={locale} notifications={recentNotifications} compact />
          ) : (
            <p className={portalChrome.body}>{t.messagesEmpty}</p>
          )}
        </section>

        <section className={cn(portalChrome.card, "flex flex-col justify-between p-5 sm:p-6")}>
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold text-zinc-950">{t.quickPublish}</h2>
              <p className={cn("mt-1 text-sm", portalChrome.body)}>{t.quickPublishBody}</p>
            </div>
          </div>
          <BrandStartBriefButton locale={locale} className={cn("mt-5 w-full", portalChrome.cta)}>
            <Plus className="h-4 w-4" />
            {t.quickPublish}
          </BrandStartBriefButton>
        </section>
      </div>
    </div>
  );
}
