"use client";

import { CreatorAiMatchHealthCard } from "@/components/studioos/creator-ai-match-health-card";
import { CreatorHomeBottomPanels } from "@/components/studioos/creator-home-bottom-panels";
import { CreatorHomeProjectsSection } from "@/components/studioos/creator-home-projects-section";
import { CreatorHomeTodayTasks } from "@/components/studioos/creator-home-today-tasks";
import { CreatorWorkspaceHero } from "@/components/studioos/creator-workspace-hero";
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

const copy = {
  zh: {
    todayTasks: "今天需要处理",
    viewAll: "查看全部",
    myProjects: "我的项目",
    viewAllProjects: "查看全部项目",
    progress: "进度",
    tabs: { all: "全部", production: "制作中", review: "审核中", pending: "待开始", completed: "已完成" },
    detail: "查看详情"
  },
  en: {
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

  return (
    <div className="space-y-6">
      <CreatorWorkspaceHero
        locale={locale}
        creatorName={creatorName}
        stats={stats}
        useDemoDate={useDemoDate}
        dateLabelOverride={useDemoDate ? creatorHomeDemoDateLabel(locale) : undefined}
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
