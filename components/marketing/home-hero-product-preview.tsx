"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  FolderKanban,
  Sparkles,
  Users
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

const copy = {
  en: {
    workspace: "Workspace",
    projects: "Projects",
    matching: "Matching",
    analytics: "Analytics",
    inProgress: "In progress",
    projectTitle: "Summer Launch — TikTok Pack",
    review: "In review",
    ctr: "CTR",
    hook: "Hook",
    escrow: "Escrow",
    pipeline: "Production pipeline",
    step1: "Brief approved",
    step2: "Nova Studio matched",
    step3: "v2 awaiting brand review",
    openDemo: "Open Brand workspace"
  },
  zh: {
    workspace: "工作区",
    projects: "项目",
    matching: "制作方匹配",
    analytics: "数据分析",
    inProgress: "进行中",
    projectTitle: "夏季上新 — TikTok 素材包",
    review: "审片中",
    ctr: "点击率",
    hook: "开场钩子",
    escrow: "托管",
    pipeline: "制作进度",
    step1: "需求简报已确认",
    step2: "Nova Studio 已匹配",
    step3: "v2 待品牌方审片",
    openDemo: "查看品牌方工作区"
  }
};

export function HomeHeroProductPreview({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((value) => (value >= 6 ? 4 : value + 1));
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-gradient-to-b from-white/[0.12] to-transparent opacity-60 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0c0c0e] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_80px_-32px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]">
        <div className="flex items-center gap-2 border-b border-white/[0.08] bg-[#111113] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-xs text-zinc-500">StudioOS — {locale === "zh" ? "品牌方" : "Brand"}</span>
          <span className="ml-auto hidden rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 sm:inline">
            {locale === "zh" ? "实时演示" : "Live preview"}
          </span>
        </div>

        <div className="grid md:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="hidden border-r border-white/[0.08] bg-[#0a0a0c] p-4 md:block">
            <p className="px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
              {t.workspace}
            </p>
            <nav className="mt-3 space-y-0.5">
              {[
                [FolderKanban, t.projects, true],
                [Users, t.matching, false],
                [BarChart3, t.analytics, false]
              ].map(([Icon, label, active]) => (
                <div
                  key={String(label)}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition ${
                    active ? "bg-white/10 text-white" : "text-zinc-500"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </div>
              ))}
            </nav>

            <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                {locale === "zh" ? "创意智能" : "Creative Intelligence"}
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-400">
                {locale === "zh"
                  ? "上一条素材 CTR 3.2%，已预填下一轮投放向导。"
                  : "Last cut CTR 3.2% — prefilled into the next campaign wizard."}
              </p>
            </div>
          </aside>

          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-500">{t.inProgress}</p>
                <p className="mt-1 text-sm font-medium tracking-tight text-white">{t.projectTitle}</p>
              </div>
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400">
                {t.review}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                [t.ctr, "3.2%"],
                [t.hook, "88"],
                [t.escrow, "$4.2k"]
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 transition hover:border-white/[0.12]"
                >
                  <p className="text-[10px] text-zinc-500">{label}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 text-[10px] text-zinc-500">
                <span>{t.pipeline}</span>
                <span>
                  {progress}/6
                </span>
              </div>
              <div className="px-3 pt-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${
                        step <= progress ? "bg-white" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <ul className="mt-3 space-y-2 pb-3">
                  {[t.step1, t.step2, t.step3].map((item, index) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-zinc-400">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 transition ${
                          index < 2 ? "text-emerald-500/90" : "text-zinc-600"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/[0.08] bg-[#0a0a0c] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-zinc-500">
            {locale === "zh" ? "基于真实品牌方工作区界面" : "Based on the live Brand workspace UI"}
          </p>
          <Link
            href={withLocale("/login?role=brand", locale)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 transition hover:text-white"
          >
            {t.openDemo}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
