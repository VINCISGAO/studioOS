import { ArrowRight, CircleDollarSign, Info, Sparkles } from "lucide-react";
import type { AiMatchReport } from "@/lib/studioos/ai-match-report";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "AI Match Report",
    whyMatch: "Why this match?",
    invitedCount: "Invited",
    response: "Response rate",
    accept: "Accept rate",
    projected: "Projected after optimization",
    budgetScore: "Budget Score",
    below: (n: number) => `Current budget is below ${n}% of similar projects.`,
    aiSuggestion: "AI suggestion",
    viewTips: "View optimization tips",
    defaultSuggestion: "Keep monitoring creator replies, or raise your budget for stronger matches"
  },
  zh: {
    title: "AI 匹配报告",
    whyMatch: "为什么这样匹配？",
    invitedCount: "邀请人数",
    response: "回复率",
    accept: "接受率",
    projected: "优化后预计",
    budgetScore: "预算评分",
    below: (n: number) => `当前预算低于 ${n}% 的同类项目。`,
    aiSuggestion: "AI 建议",
    viewTips: "查看优化建议",
    defaultSuggestion: "继续观察创作者回复，或提高预算可获得更多优质匹配"
  }
} as const;

export function BrandAiMatchReportCard({
  locale,
  report
}: {
  locale: Locale;
  report: AiMatchReport;
}) {
  const t = copy[locale];
  const primarySuggestion = report.recommendations[0] ?? t.defaultSuggestion;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-violet-700">{t.title}</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-violet-700"
        >
          {t.whyMatch}
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Metric label={t.invitedCount} value={String(report.invitedCount)} />
          <Metric label={t.response} value={`${report.responseRate}%`} />
          <Metric label={t.accept} value={`${report.acceptanceRate}%`} />
          <Metric
            label={t.projected}
            value={`${report.projectedAcceptanceRate}%`}
            highlight
            showUpArrow
          />
          <BudgetScoreCard
            label={t.budgetScore}
            score={report.budgetScore}
            caption={t.below(report.marketBelowPercent)}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-violet-50/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-violet-700">{t.aiSuggestion}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">{primarySuggestion}</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium text-violet-700 transition hover:text-violet-800 sm:self-center"
          >
            {t.viewTips}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  highlight = false,
  showUpArrow = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
  showUpArrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        highlight ? "border-emerald-200 bg-emerald-50" : "border-zinc-200/80 bg-white"
      )}
    >
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-xl font-semibold tabular-nums",
          highlight ? "inline-flex items-center gap-0.5 text-emerald-700" : "text-zinc-950"
        )}
      >
        {value}
        {showUpArrow ? <span className="text-sm">↑</span> : null}
      </p>
    </div>
  );
}

function BudgetScoreCard({
  label,
  score,
  caption
}: {
  label: string;
  score: number;
  caption: string;
}) {
  return (
    <div className="col-span-2 rounded-xl border border-emerald-200 bg-white px-3 py-3 sm:col-span-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800">
        <CircleDollarSign className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular-nums text-emerald-700">
        {score}
        <span className="text-base font-medium text-emerald-600/70">/100</span>
      </p>
      <p className="mt-1.5 text-[11px] leading-4 text-zinc-500">{caption}</p>
    </div>
  );
}
