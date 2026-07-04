"use client";

import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import type { Locale } from "@/lib/i18n";
import { CheckCircle2, ClipboardList, LayoutGrid, Pencil, Plus, Sparkles } from "lucide-react";

const copy = {
  en: {
    greeting: (name: string) => `Hi, ${name} 👋`,
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
    greeting: (name: string) => `${name}，早上好 👋`,
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
  const displayName = name.trim() || (locale === "zh" ? "朋友" : "there");
  const completed = Math.max(total - drafts - active, 0);

  const stats = [
    { label: t.total, value: total, icon: LayoutGrid, tone: "text-violet-600 bg-violet-100", delta: "+100%" },
    { label: t.drafts, value: drafts, icon: ClipboardList, tone: "text-sky-600 bg-sky-100", delta: "--" },
    { label: t.active, value: active, icon: Pencil, tone: "text-emerald-600 bg-emerald-100", delta: "--" },
    { label: t.completed, value: completed, icon: CheckCircle2, tone: "text-amber-600 bg-amber-100", delta: "+100%" }
  ];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-violet-100/80 bg-gradient-to-br from-white via-white to-violet-50/70 p-6 shadow-[0_18px_60px_rgba(88,80,236,0.09)] sm:p-8 lg:p-9">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-200/25 blur-3xl" />

      <div className="relative">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-[42px]">
            {t.greeting(displayName)}
          </h1>
          <p className="mt-5 text-lg font-semibold text-zinc-900">{t.headline}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">{t.steps}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <BrandStartBriefButton
              locale={locale}
              size="lg"
              className="inline-flex h-12 items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(109,40,217,0.24)] hover:from-violet-700 hover:to-indigo-700"
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
      </div>

      <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-3xl border border-zinc-100 bg-white/90 px-5 py-5 shadow-[0_12px_34px_rgba(15,23,42,0.055)] backdrop-blur"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                  <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-zinc-950">{stat.value}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                {t.month} <span className={stat.delta.startsWith("+") ? "font-semibold text-emerald-500" : "text-zinc-400"}>{stat.delta}</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
