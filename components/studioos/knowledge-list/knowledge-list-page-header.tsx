"use client";

import type { KnowledgeDashboardStatsDto } from "@/features/knowledge-center/knowledge-center.types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function MiniSparkline({ tone }: { tone: "emerald" | "violet" }) {
  const stroke = tone === "emerald" ? "#10b981" : "#8b5cf6";
  return (
    <svg viewBox="0 0 80 24" className="h-6 w-20 shrink-0" aria-hidden>
      <path
        d="M0 18 L12 14 L24 16 L36 10 L48 12 L60 6 L72 8 L80 4"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RingProgress({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "violet" }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.min(100, Math.max(0, value));
  const offset = circumference - (normalized / 100) * circumference;
  const color = tone === "emerald" ? "text-emerald-500" : "text-violet-500";
  return (
    <div className={cn("relative h-10 w-10 shrink-0", color)}>
      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-zinc-700">
        {normalized}%
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  dotTone,
  sparkline,
  ring
}: {
  label: string;
  value: string | number;
  hint: string;
  dotTone?: "emerald" | "violet";
  sparkline?: "emerald" | "violet";
  ring?: number;
}) {
  return (
    <div className="flex min-h-[104px] min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-2">
        <div className="min-w-0">
          <p className="text-2xl font-semibold text-zinc-950">{value}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-zinc-400">
            {dotTone ? (
              <span className={cn("h-1.5 w-1.5 rounded-full", dotTone === "emerald" ? "bg-emerald-500" : "bg-violet-500")} />
            ) : null}
            {hint}
          </p>
        </div>
        {sparkline ? <MiniSparkline tone={sparkline} /> : null}
        {ring !== undefined ? <RingProgress value={ring} /> : null}
      </div>
    </div>
  );
}

export function KnowledgeListStatsRow({ locale, stats }: { locale: Locale; stats: KnowledgeDashboardStatsDto }) {
  const zh = locale === "zh";
  const lucienRate =
    stats.articles > 0 ? Math.min(100, Math.round((stats.lucien_indexed / stats.articles) * 100)) : 0;

  return (
    <div className="grid w-full grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard label={zh ? "文章总数" : "Total"} value={stats.articles} hint={zh ? "全部文章" : "All articles"} />
      <StatCard
        label={zh ? "已发布" : "Published"}
        value={stats.published}
        hint={zh ? "公开可访问" : "Public"}
        dotTone="emerald"
        sparkline="emerald"
      />
      <StatCard
        label={zh ? "草稿" : "Drafts"}
        value={stats.draft}
        hint={zh ? "待完善" : "In progress"}
        dotTone="violet"
        sparkline="violet"
      />
      <StatCard
        label={zh ? "AI 同步" : "AI sync"}
        value={`${lucienRate}%`}
        hint={zh ? "Lucien 同步率" : "Lucien sync rate"}
        ring={lucienRate}
      />
    </div>
  );
}

export function KnowledgeListPageHeader({ locale, stats }: { locale: Locale; stats: KnowledgeDashboardStatsDto | null }) {
  const zh = locale === "zh";

  return (
    <div className="space-y-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
          {zh ? "VINCIS 管理后台" : "VINCIS Admin"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          {zh ? "知识中心" : "Knowledge Center"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
          {zh
            ? "VINCIS 官方知识库 — 服务 Google / 百度 SEO、AI 助手、帮助中心与 Lucien。"
            : "Official VINCIS knowledge base for SEO, AI assistants, Help Center, and Lucien."}
        </p>
      </div>
      {stats ? <KnowledgeListStatsRow locale={locale} stats={stats} /> : null}
    </div>
  );
}
