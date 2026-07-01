"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { CreatorHomeBottomPanels } from "@/components/studioos/creator-home-bottom-panels";
import { CreatorHomeProjectsSection } from "@/components/studioos/creator-home-projects-section";
import { CreatorHomeStatCards } from "@/components/studioos/creator-home-stat-cards";
import { CreatorHomeTodayTasks } from "@/components/studioos/creator-home-today-tasks";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type {
  CreatorHomeMessageRow,
  CreatorHomeProjectRow,
  CreatorHomeStats,
  CreatorPendingTaskCard,
  CreatorPhaseCount
} from "@/lib/studioos/creator-home-ui";
import { creatorHomeDemoDateLabel } from "@/lib/studioos/creator-home-ui";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

const copy = {
  zh: {
    welcome: "欢迎回来",
    calendar: "日历视图",
    totalEarnings: "累计收入",
    activeProjects: "进行中项目",
    pendingTasks: "待处理事项",
    verification: "认证状态",
    responseTime: "平均响应时间",
    proCreator: "专业创作者",
    todayTasks: "今天需要处理",
    viewAll: "查看全部",
    myProjects: "我的项目",
    viewAllProjects: "查看全部项目",
    progress: "进度",
    tabs: { all: "全部", production: "制作中", review: "审核中", pending: "待开始", completed: "已完成" },
    detail: "查看详情"
  },
  en: {
    welcome: "Welcome back",
    calendar: "Calendar",
    totalEarnings: "Total earnings",
    activeProjects: "Active projects",
    pendingTasks: "Pending tasks",
    verification: "Verification",
    responseTime: "Avg response",
    proCreator: "Pro creator",
    todayTasks: "Handle today",
    viewAll: "View all",
    myProjects: "My projects",
    viewAllProjects: "All projects",
    progress: "Progress",
    tabs: { all: "All", production: "Production", review: "In review", pending: "Pending", completed: "Done" },
    detail: "Details"
  }
} as const;

export function CreatorHomeDashboard({
  locale,
  creatorName,
  stats,
  pendingTasks,
  projects,
  phases,
  messages,
  useDemoDate = false
}: {
  locale: Locale;
  creatorName: string;
  stats: CreatorHomeStats;
  pendingTasks: CreatorPendingTaskCard[];
  projects: CreatorHomeProjectRow[];
  phases: CreatorPhaseCount;
  messages: CreatorHomeMessageRow[];
  useDemoDate?: boolean;
}) {
  const t = copy[locale];
  const today = new Date();
  const dateLabel = useMemo(() => {
    if (useDemoDate) {
      return creatorHomeDemoDateLabel(locale);
    }
    return locale === "zh"
      ? `今天是 ${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日，${["日", "一", "二", "三", "四", "五", "六"][today.getDay()]}`
      : today.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
  }, [locale, today, useDemoDate]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px]">
            {t.welcome}，{creatorName} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
        </div>
        <Button variant="outline" className="h-10 rounded-xl border-zinc-200 bg-white text-zinc-700 shadow-sm">
          <CalendarDays className="mr-2 h-4 w-4" />
          {t.calendar}
        </Button>
      </section>

      <CreatorHomeStatCards
        labels={{
          totalEarnings: t.totalEarnings,
          activeProjects: t.activeProjects,
          pendingTasks: t.pendingTasks,
          verification: t.verification,
          responseTime: t.responseTime,
          proCreator: t.proCreator
        }}
        stats={stats}
      />

      <CreatorHomeTodayTasks
        title={t.todayTasks}
        viewAllHref={withLocale(creatorPortalRoutes.invitations, locale)}
        viewAllLabel={t.viewAll}
        pendingTasks={pendingTasks}
      />

      <CreatorHomeProjectsSection
        locale={locale}
        title={t.myProjects}
        viewAllHref={withLocale(creatorPortalRoutes.projects, locale)}
        viewAllLabel={t.viewAllProjects}
        detailLabel={t.detail}
        progressLabel={t.progress}
        tabLabels={t.tabs}
        projects={projects}
      />

      <CreatorHomeBottomPanels locale={locale} phases={phases} messages={messages} />
    </div>
  );
}
