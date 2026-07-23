"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Clock3, DollarSign, FolderKanban } from "lucide-react";
import {
  BrandWorkspaceHeroBackdrop,
  BrandWorkspaceHeroMascot
} from "@/components/studioos/brand-workspace/brand-workspace-art";
import { BrandWorkspaceStatCard } from "@/components/studioos/brand-workspace/brand-workspace-stat-card";
import type { Locale } from "@/lib/i18n";
import type { CreatorHomeStats } from "@/lib/studioos/creator-home-ui";
import { formatSettlementUsd } from "@/lib/money/display-money";

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
  en: {
    greetingPrefix: (dayPart: DayPart | null) => {
      if (dayPart === "morning") return "Good morning";
      if (dayPart === "afternoon") return "Good afternoon";
      if (dayPart === "evening") return "Good evening";
      return "Hi";
    },
    totalEarnings: "Total earnings",
    activeProjects: "Active projects",
    verification: "Verification",
    responseTime: "Avg response",
    verifyPendingHint: "Complete certification to unlock more invitations",
    verifyDoneHint: "Professional creator benefits active",
    month: "vs last month"
  },
  zh: {
    greetingPrefix: (dayPart: DayPart | null) => {
      if (dayPart === "morning") return "早上好";
      if (dayPart === "afternoon") return "下午好";
      if (dayPart === "evening") return "晚上好";
      return "你好";
    },
    totalEarnings: "累计收入",
    activeProjects: "进行中项目",
    verification: "认证状态",
    responseTime: "平均响应时间",
    verifyPendingHint: "完成认证解锁更多邀请",
    verifyDoneHint: "已享受专业创作者权益",
    month: "较上月"
  }
} as const;

function isCreatorVerifiedLabel(label: string) {
  return label === "已认证" || label === "Verified";
}

function trendDelta(trend: string, monthLabel: string) {
  const stripped = trend.replace(monthLabel, "").trim();
  return stripped || "--";
}

function trendUp(trend: string) {
  return trend.includes("↑");
}

export function CreatorWorkspaceHero({
  locale,
  creatorName,
  stats,
  useDemoDate = false,
  dateLabelOverride
}: {
  locale: Locale;
  creatorName: string;
  stats: CreatorHomeStats;
  useDemoDate?: boolean;
  dateLabelOverride?: string;
}) {
  const t = copy[locale];
  const dayPart = useLocalDayPart();
  const displayName = creatorName.trim() || (locale === "zh" ? "朋友" : "there");
  const dateLabel = useMemo(() => {
    if (dateLabelOverride) return dateLabelOverride;
    if (useDemoDate) {
      return locale === "zh"
        ? "今天是 2026年7月16日，星期四"
        : "Thursday, July 16, 2026";
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
  }, [dateLabelOverride, locale, useDemoDate]);

  const greetingPrefix = t.greetingPrefix(dayPart);

  const statCards = [
    {
      label: t.totalEarnings,
      value: formatSettlementUsd(stats.totalEarnings, locale),
      icon: DollarSign,
      iconTone: "bg-violet-100 text-violet-700",
      waveTone: trendUp(stats.earningsTrend) ? "text-violet-500" : "text-violet-400",
      delta: trendDelta(stats.earningsTrend, t.month),
      comparisonText: stats.earningsTrend
    },
    {
      label: t.activeProjects,
      value: stats.activeProjects,
      icon: FolderKanban,
      iconTone: "bg-sky-100 text-sky-700",
      waveTone: trendUp(stats.activeTrend) ? "text-sky-500" : "text-sky-400",
      delta: trendDelta(stats.activeTrend, t.month),
      comparisonText: stats.activeTrend
    },
    {
      label: t.verification,
      value: stats.verifiedLabel,
      icon: BadgeCheck,
      iconTone: "bg-emerald-100 text-emerald-700",
      waveTone: "text-emerald-500",
      delta: "--",
      comparisonText: isCreatorVerifiedLabel(stats.verifiedLabel)
        ? t.verifyDoneHint
        : t.verifyPendingHint,
      showSparkline: false,
      layout: "status" as const
    },
    {
      label: t.responseTime,
      value: `${stats.avgResponseHours}h`,
      icon: Clock3,
      iconTone: "bg-violet-100 text-violet-700",
      waveTone: trendUp(stats.responseTrend) ? "text-violet-500" : "text-violet-400",
      delta: trendDelta(stats.responseTrend, t.month),
      comparisonText: stats.responseTrend
    }
  ];

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-violet-100/80 bg-white/40 px-4 py-5 shadow-[0_10px_40px_-28px_rgba(124,58,237,0.45)] sm:px-6 sm:py-6">
      <BrandWorkspaceHeroBackdrop />

      <div className="relative z-10 space-y-5 pr-0 xl:pr-40 2xl:pr-48">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px] lg:text-[32px]">
            {locale === "zh" ? (
              <>
                {greetingPrefix}，<span className="text-violet-600">{displayName}</span>
              </>
            ) : (
              <>
                {greetingPrefix}, <span className="text-violet-600">{displayName}</span>
              </>
            )}
            <span className="ml-1.5" aria-hidden>
              👋
            </span>
            <span className="ml-1" aria-hidden>
              ✨
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-500 sm:text-base">{dateLabel}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {statCards.map((stat) => (
            <BrandWorkspaceStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconTone={stat.iconTone}
              waveTone={stat.waveTone}
              monthLabel={t.month}
              delta={stat.delta}
              comparisonText={stat.comparisonText}
              showSparkline={"showSparkline" in stat ? stat.showSparkline : true}
              layout={"layout" in stat ? stat.layout : "metric"}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 hidden w-[140px] xl:block 2xl:right-4 2xl:w-[164px]">
        <BrandWorkspaceHeroMascot className="h-auto w-full object-contain object-bottom drop-shadow-[0_12px_28px_rgba(124,58,237,0.22)]" />
      </div>
    </section>
  );
}
