import { ArrowRight, CircleDollarSign, Info, Sparkles } from "lucide-react";
import type { AiMatchReport } from "@/lib/studioos/ai-match-report";
import type { Locale } from "@/lib/i18n";
import { cn, formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "AI Match Report",
    title: "Matching health",
    invited: "Invited",
    response: "Response rate",
    accept: "Accept rate",
    projected: "Projected after optimization",
    budgetScore: "Budget Score",
    below: (n: number) => `Current budget is below ${n}% of similar projects.`,
    aiSuggestion: "AI suggestion",
    viewTips: "View optimization tips",
    suggestionBody: (low: number, high: number) =>
      `Keep monitoring creator replies. We recommend keeping budget in the ${formatCurrency(low)}–${formatCurrency(high)} range to improve acceptance.`
  },
  zh: {
    eyebrow: "AI Match Report",
    title: "匹配健康度",
    invited: "邀请",
    response: "回复率",
    accept: "接受率",
    projected: "优化后预计",
    budgetScore: "Budget Score",
    below: (n: number) => `当前预算低于 ${n}% 的同类项目。`,
    aiSuggestion: "AI 建议",
    viewTips: "查看优化建议",
    suggestionBody: (low: number, high: number) =>
      `继续观察 Creator 回复，建议保持预算在 ${formatCurrency(low)}~${formatCurrency(high)} 区间以提升接受率。`
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
  const budgetLow = Math.max(50, Math.round(report.currentBudget * 0.75 / 50) * 50);
  const budgetHigh = Math.max(budgetLow + 50, Math.round(report.suggestedBudget * 1.1 / 50) * 50);
  const primarySuggestion = report.recommendations[0] ?? t.suggestionBody(budgetLow, budgetHigh);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600">{t.eyebrow}</p>
        <span className="text-zinc-300">·</span>
        <h2 className="text-sm font-semibold text-zinc-950">{t.title}</h2>
        <Info className="ml-0.5 h-3.5 w-3.5 text-zinc-400" aria-hidden />
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label={t.invited} value={String(report.invitedCount)} />
            <Metric label={t.response} value={`${report.responseRate}%`} />
            <Metric label={t.accept} value={`${report.acceptanceRate}%`} />
            <Metric
              label={t.projected}
              value={`${report.projectedAcceptanceRate}%`}
              highlight
              showUpArrow
            />
          </div>

          <div className="flex min-w-[180px] flex-col justify-center rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 lg:max-w-[220px]">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
              <CircleDollarSign className="h-3.5 w-3.5" />
              {t.budgetScore}
            </div>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-700">
              {report.budgetScore}
              <span className="text-lg font-medium text-emerald-600/70">/100</span>
            </p>
            <p className="mt-2 text-xs leading-5 text-emerald-800/80">{t.below(report.marketBelowPercent)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-violet-50/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-violet-700">{t.aiSuggestion}</p>
              <p className="mt-1 text-sm leading-relaxed text-violet-900/90">{primarySuggestion}</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg px-2 py-1 text-sm font-medium text-violet-700 transition hover:bg-violet-100/80 sm:self-center"
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
        "rounded-xl border px-3 py-2.5",
        highlight ? "border-emerald-200 bg-emerald-50" : "border-zinc-200/80 bg-zinc-50/50"
      )}
    >
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          highlight ? "inline-flex items-center gap-0.5 text-emerald-700" : "text-zinc-950"
        )}
      >
        {value}
        {showUpArrow ? <span className="text-sm">↑</span> : null}
      </p>
    </div>
  );
}
