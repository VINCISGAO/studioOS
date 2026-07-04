"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import type { Locale } from "@/lib/i18n";
import { CheckCircle2, ClipboardList, LayoutGrid, Pencil, Plus, Sparkles } from "lucide-react";

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
    greeting: (name: string, dayPart: DayPart | null) => {
      const prefix =
        dayPart === "morning" ? "Good morning" : dayPart === "afternoon" ? "Good afternoon" : dayPart === "evening" ? "Good evening" : "Hi";
      return `${prefix} 👋 ${name}`;
    },
    headline: "What ad do you want to make today?",
    steps: "Three steps: brief, pick a studio, review and approve.",
    publish: "Publish ad brief",
    aiCreate: "AI smart create",
    report: "AI analysis report",
    total: "All ads",
    drafts: "Drafts",
    active: "In progress",
    completed: "Completed",
    month: "vs last month"
  },
  zh: {
    greeting: (name: string, dayPart: DayPart | null) => {
      const prefix = dayPart === "morning" ? "早上好" : dayPart === "afternoon" ? "下午好" : dayPart === "evening" ? "晚上好" : "你好";
      return `${prefix} 👋 ${name}`;
    },
    headline: "今天想做什么广告？",
    steps: "三步搞定：说清需求、选制作团队、审片验收。",
    publish: "发布广告需求",
    aiCreate: "AI 智能创建",
    report: "AI 分析报告",
    total: "全部广告",
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
  active
}: {
  locale: Locale;
  name: string;
  total: number;
  drafts: number;
  active: number;
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
    { label: t.total, value: total, icon: LayoutGrid, tone: "text-violet-700 bg-violet-100", delta: "+100%" },
    { label: t.drafts, value: drafts, icon: ClipboardList, tone: "text-blue-700 bg-blue-100", delta: "--" },
    { label: t.active, value: active, icon: Pencil, tone: "text-emerald-700 bg-emerald-100", delta: "--" },
    { label: t.completed, value: completed, icon: CheckCircle2, tone: "text-amber-700 bg-amber-100", delta: "+100%" }
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl lg:text-[34px]">
            {t.greeting(displayName, dayPart)}
          </h1>
          <p className="mt-2 text-base text-zinc-500 sm:text-lg">{dateLabel}</p>
          <p className="mt-5 text-lg font-semibold text-zinc-900">{t.headline}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">{t.steps}</p>
        </div>

        <div className="flex flex-wrap gap-3 sm:justify-end">
          <BrandStartBriefButton
            locale={locale}
            size="lg"
            className="inline-flex h-12 items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(109,40,217,0.22)] hover:from-violet-700 hover:to-indigo-700"
          >
            <Plus className="h-5 w-5" />
            {t.publish}
          </BrandStartBriefButton>
          <a
            href="/brand/ai"
            className="inline-flex h-12 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
          >
            <Sparkles className="h-5 w-5 text-violet-600" />
            {t.aiCreate}
            <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-600">Beta</span>
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-950">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-zinc-400">
                {t.month} <span className={stat.delta.startsWith("+") ? "font-semibold text-emerald-500" : "text-zinc-400"}>{stat.delta}</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
