"use client";

import Link from "next/link";
import { BrandStartBriefButton } from "@/components/studioos/brand-start-brief-button";
import type { Locale } from "@/lib/i18n";
import { LayoutGrid, Pencil, Plus, Send } from "lucide-react";

const copy = {
  en: {
    eyebrow: "Brand workspace",
    greeting: (name: string) => `Hi, ${name} 👋`,
    headline: "What ad do you want to make today?",
    steps: "Three steps: brief, pick a studio, review and approve.",
    publish: "Publish ad brief"
  },
  zh: {
    eyebrow: "品牌工作台",
    greeting: (name: string) => `${name}，你好 👋`,
    headline: "今天想做什么广告？",
    steps: "三步搞定：说清需求、选制作团队、审片验收。",
    publish: "发布广告需求"
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

  const stats = [
    { label: locale === "zh" ? "全部" : "All", value: total, icon: LayoutGrid, tone: "text-violet-600 bg-violet-100" },
    { label: locale === "zh" ? "草稿" : "Drafts", value: drafts, icon: Pencil, tone: "text-sky-600 bg-sky-100" },
    { label: locale === "zh" ? "进行中" : "In progress", value: active, icon: Send, tone: "text-emerald-600 bg-emerald-100" }
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-gradient-to-l from-violet-50/90 via-indigo-50/40 to-transparent lg:block" />
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-violet-600">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-[34px]">
            {t.greeting(displayName)}
          </h1>
          <p className="mt-2 text-lg font-medium text-zinc-800">{t.headline}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">{t.steps}</p>
          <BrandStartBriefButton
            locale={locale}
            size="lg"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            {t.publish}
          </BrandStartBriefButton>
        </div>

        <div className="relative flex items-end gap-6 lg:min-w-[360px]">
          <div className="relative hidden h-36 w-40 shrink-0 lg:block" aria-hidden>
            <div className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg">
              <span className="ml-0.5 text-sm font-bold">▶</span>
            </div>
            <div className="absolute left-2 top-8 h-24 w-20 rounded-2xl bg-white/90 shadow-md ring-1 ring-violet-100" />
            <div className="absolute left-5 top-12 h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 opacity-90" />
            <div className="absolute bottom-2 right-6 h-16 w-24 rounded-xl bg-white/80 shadow-sm ring-1 ring-violet-100" />
            <div className="absolute bottom-5 right-8 flex h-8 items-end gap-1">
              <span className="h-6 w-2 rounded-sm bg-violet-400" />
              <span className="h-10 w-2 rounded-sm bg-indigo-400" />
              <span className="h-4 w-2 rounded-sm bg-violet-300" />
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-3 sm:gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-zinc-200/80 bg-white px-3 py-4 text-center shadow-sm sm:px-4"
                >
                  <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-zinc-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
