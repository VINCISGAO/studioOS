"use client";

import { useEffect, useMemo, useState } from "react";
import { CreatorAiMatchHealthCard } from "@/components/studioos/creator-ai-match-health-card";
import { CreatorHomeBottomPanels } from "@/components/studioos/creator-home-bottom-panels";
import { CreatorHomeProjectsSection } from "@/components/studioos/creator-home-projects-section";
import { CreatorHomeStatCards } from "@/components/studioos/creator-home-stat-cards";
import { CreatorHomeTodayTasks } from "@/components/studioos/creator-home-today-tasks";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type {
  CreatorHomeMessageRow,
  CreatorHomeProjectRow,
  CreatorHomeStats,
  CreatorPendingTaskCard,
  CreatorPhaseCount
} from "@/lib/studioos/creator-home-ui";
import type { CreatorAiMatchHealth } from "@/lib/studioos/creator-ai-match-health";
import { creatorHomeDemoDateLabel } from "@/lib/studioos/creator-home-ui";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";

type DayPart = "morning" | "afternoon" | "evening";

function dayPartFromHour(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

function useLocalDayPart() {
  const [dayPart, setDayPart] = useState<DayPart | null>(null);

  useEffect(() => {
    setDayPart(dayPartFromHour(new Date().getHours()));
  }, []);

  return dayPart;
}

const copy = {
  zh: {
    welcome: (dayPart: DayPart | null) =>
      dayPart === "morning" ? "早上好" : dayPart === "afternoon" ? "下午好" : dayPart === "evening" ? "晚上好" : "你好",
    totalEarnings: "累计收入",
    activeProjects: "进行中项目",
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
    welcome: (dayPart: DayPart | null) =>
      dayPart === "morning"
        ? "Good morning"
        : dayPart === "afternoon"
          ? "Good afternoon"
          : dayPart === "evening"
            ? "Good evening"
            : "Hi",
    totalEarnings: "Total earnings",
    activeProjects: "Active projects",
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
  aiMatchHealth,
  useDemoDate = false
}: {
  locale: Locale;
  creatorName: string;
  stats: CreatorHomeStats;
  pendingTasks: CreatorPendingTaskCard[];
  projects: CreatorHomeProjectRow[];
  phases: CreatorPhaseCount;
  messages: CreatorHomeMessageRow[];
  aiMatchHealth: CreatorAiMatchHealth;
  useDemoDate?: boolean;
}) {
  const t = copy[locale];
  const dayPart = useLocalDayPart();
  const displayName = creatorName.trim() || (locale === "zh" ? "朋友" : "there");
  const dateLabel = useMemo(() => {
    if (useDemoDate) {
      return creatorHomeDemoDateLabel(locale);
    }
    const today = new Date();
    return locale === "zh"
      ? `今天是 ${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日，星期${["日", "一", "二", "三", "四", "五", "六"][today.getDay()]}`
      : today.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
  }, [locale, useDemoDate]);

  return (
    <div className="space-y-6">
      <section>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl lg:text-[34px]">
            {t.welcome(dayPart)} 👋 {displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
        </div>
      </section>

      <CreatorHomeStatCards
        locale={locale}
        labels={{
          totalEarnings: t.totalEarnings,
          activeProjects: t.activeProjects,
          verification: t.verification,
          responseTime: t.responseTime,
          proCreator: t.proCreator
        }}
        stats={stats}
      />

      <CreatorAiMatchHealthCard health={aiMatchHealth} />

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
