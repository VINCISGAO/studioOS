"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Hourglass, LayoutGrid } from "lucide-react";
import { BrandWorkspaceHeroBackdrop, BrandWorkspaceHeroMascot } from "@/components/studioos/brand-workspace/brand-workspace-art";
import { BrandWorkspaceStatCard } from "@/components/studioos/brand-workspace/brand-workspace-stat-card";
import { BrandWorkspaceToolbar } from "@/components/studioos/brand-workspace/brand-workspace-toolbar";
import type { Locale } from "@/lib/i18n";
import type { BrandNewCampaignGate } from "@/lib/studioos/brand-active-campaign-limit";

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
    total: "All ad briefs",
    drafts: "Drafts",
    active: "In progress",
    completed: "Completed",
    month: "vs last month"
  },
  zh: {
    greetingPrefix: (dayPart: DayPart | null) => {
      if (dayPart === "morning") return "早上好";
      if (dayPart === "afternoon") return "下午好";
      if (dayPart === "evening") return "晚上好";
      return "你好";
    },
    total: "全部广告需求",
    drafts: "草稿",
    active: "进行中",
    completed: "已完成",
    month: "较上月"
  }
};

export function BrandWorkspaceHero({
  locale,
  name,
  total,
  drafts,
  active,
  activeCampaignCount = 0,
  creationGate,
  rateLimitCode = null
}: {
  locale: Locale;
  name: string;
  total: number;
  drafts: number;
  active: number;
  activeCampaignCount?: number;
  creationGate?: BrandNewCampaignGate;
  rateLimitCode?: "rate_limit_10m" | "rate_limit_24h" | null;
}) {
  const t = copy[locale];
  const dayPart = useLocalDayPart();
  const displayName = name.trim() || (locale === "zh" ? "朋友" : "there");
  const completed = Math.max(total - drafts - active, 0);
  const dateLabel = useMemo(() => {
    const today = new Date();
    return locale === "zh"
      ? `今天是 ${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日，星期${["日", "一", "二", "三", "四", "五", "六"][today.getDay()]}`
      : today.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
  }, [locale]);

  const stats = [
    {
      label: t.total,
      value: total,
      icon: LayoutGrid,
      iconTone: "bg-violet-100 text-violet-700",
      waveTone: "text-violet-500",
      delta: "100%"
    },
    {
      label: t.drafts,
      value: drafts,
      icon: ClipboardList,
      iconTone: "bg-sky-100 text-sky-700",
      waveTone: "text-sky-500",
      delta: "--"
    },
    {
      label: t.active,
      value: active,
      icon: Hourglass,
      iconTone: "bg-emerald-100 text-emerald-700",
      waveTone: "text-emerald-500",
      delta: "--"
    },
    {
      label: t.completed,
      value: completed,
      icon: CheckCircle2,
      iconTone: "bg-amber-100 text-amber-700",
      waveTone: "text-amber-500",
      delta: "100%"
    }
  ];

  const greetingPrefix = t.greetingPrefix(dayPart);

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-violet-100/80 bg-white/40 px-4 py-5 shadow-[0_10px_40px_-28px_rgba(124,58,237,0.45)] sm:px-6 sm:py-6">
      <BrandWorkspaceHeroBackdrop />

      <div className="relative z-10 space-y-5 pr-0 xl:pr-40 2xl:pr-48">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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

          <BrandWorkspaceToolbar
            locale={locale}
            activeCampaignCount={activeCampaignCount}
            creationGate={creationGate}
            rateLimitCode={rateLimitCode}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {stats.map((stat) => (
            <BrandWorkspaceStatCard key={stat.label} monthLabel={t.month} {...stat} />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 hidden w-[140px] xl:block 2xl:right-4 2xl:w-[164px]">
        <BrandWorkspaceHeroMascot className="h-auto w-full object-contain object-bottom drop-shadow-[0_12px_28px_rgba(124,58,237,0.22)]" />
      </div>
    </section>
  );
}
