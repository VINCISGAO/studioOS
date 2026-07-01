"use client";

import Link from "next/link";
import { ArrowRight, CircleDollarSign, Clock3, Inbox, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  creatorTodayTaskLabels,
  type CreatorTodayTask
} from "@/lib/studioos/creator-order-lifecycle";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn, formatCurrency } from "@/lib/utils";

const taskIcons: Record<CreatorTodayTask, typeof Inbox> = {
  accept_invitation: Inbox,
  wait_brand_selection: Clock3,
  upload_work: Upload,
  brand_review: Video,
  collect_payment: CircleDollarSign
};

const taskLinks: Record<CreatorTodayTask, string> = {
  accept_invitation: creatorPortalRoutes.invitations,
  wait_brand_selection: creatorPortalRoutes.invitations,
  upload_work: creatorPortalRoutes.projects,
  brand_review: creatorPortalRoutes.projects,
  collect_payment: creatorPortalRoutes.income
};

const copy = {
  en: {
    eyebrow: "Creator workspace",
    title: "What should you do today?",
    emptyTasks: "You're all caught up for now.",
    statsTitle: "Overview",
    todayIncome: "Today's income",
    pendingSettlement: "Pending settlement",
    completionRate: "Completion rate",
    responseRate: "Response rate",
    viewInvitations: "View invitations"
  },
  zh: {
    eyebrow: "创作者后台",
    title: "今天应该做什么",
    emptyTasks: "目前没有待办事项。",
    statsTitle: "数据概览",
    todayIncome: "今日收入",
    pendingSettlement: "待结算金额",
    completionRate: "完成率",
    responseRate: "响应率",
    viewInvitations: "查看项目邀请"
  }
};

type Props = {
  locale: Locale;
  creatorName: string;
  tasks: CreatorTodayTask[];
  stats: {
    todayIncome: number;
    pendingSettlement: number;
    completionRate: number;
    responseRate: number;
    pendingInvitations: number;
  };
};

export function CreatorHomeDashboard({ locale, creatorName, tasks, stats }: Props) {
  const t = copy[locale];
  const labels = creatorTodayTaskLabels[locale];

  return (
    <div className="space-y-6">
      <section className={cn(portalChrome.card, "overflow-hidden")}>
        <div className="border-b border-zinc-100 p-6 sm:p-8">
          <p className={portalChrome.eyebrow}>{t.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            {t.title}
          </h1>
          <p className={cn("mt-2", portalChrome.body)}>
            {locale === "zh" ? `${creatorName}，按优先级处理下面的事项。` : `${creatorName}, work through these in order.`}
          </p>
        </div>

        <div className="divide-y divide-zinc-100">
          {tasks.length ? (
            tasks.map((task) => {
              const Icon = taskIcons[task];
              return (
                <Link
                  key={task}
                  href={withLocale(taskLinks[task], locale)}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-zinc-50/80 sm:px-8"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-950">{labels[task]}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
                </Link>
              );
            })
          ) : (
            <div className="flex items-center gap-3 px-6 py-8 sm:px-8">
              <Clock3 className="h-5 w-5 text-zinc-400" />
              <p className={portalChrome.body}>{t.emptyTasks}</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t.todayIncome, value: formatCurrency(stats.todayIncome) },
          { label: t.pendingSettlement, value: formatCurrency(stats.pendingSettlement) },
          { label: t.completionRate, value: `${stats.completionRate}%` },
          { label: t.responseRate, value: `${stats.responseRate}%` }
        ].map((stat) => (
          <div key={stat.label} className={cn(portalChrome.card, "p-5")}>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </section>

      {stats.pendingInvitations > 0 ? (
        <section className={cn(portalChrome.card, "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6")}>
          <div>
            <p className="font-semibold text-zinc-950">
              {locale === "zh"
                ? `${stats.pendingInvitations} 条项目邀请等待处理`
                : `${stats.pendingInvitations} invitation${stats.pendingInvitations === 1 ? "" : "s"} waiting`}
            </p>
            <p className={cn("mt-1", portalChrome.body)}>
              {locale === "zh" ? "项目邀请是最重要的入口之一。" : "Invitations are one of your most important entry points."}
            </p>
          </div>
          <Button asChild className={portalChrome.cta}>
            <Link href={withLocale(creatorPortalRoutes.invitations, locale)}>
              {t.viewInvitations}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      ) : null}
    </div>
  );
}
