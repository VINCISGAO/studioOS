import { ArrowUpRight, BarChart3, Brain, CircleDollarSign } from "lucide-react";
import type { AiMatchReport } from "@/lib/studioos/ai-match-report";
import type { Locale } from "@/lib/i18n";
import { cn, formatCurrency } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "AI Match Report",
    title: "Matching health",
    invited: "Invited",
    response: "Response",
    accept: "Accept",
    projected: "Projected after optimization",
    budgetScore: "Budget Score",
    below: (n: number) => `Current budget is below ${n}% of similar opportunities.`,
    reasons: "Main decline reasons",
    suggestions: "AI suggestions",
    expanding: "AI is expanding the matching range because no creator has accepted yet.",
    suggestedBudget: "Suggested budget"
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
    reasons: "主要拒绝原因",
    suggestions: "AI 建议",
    expanding: "AI 正在扩大匹配范围，因为当前还没有 Creator 接受。",
    suggestedBudget: "建议预算"
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
  const tone =
    report.budgetLevel === "excellent"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : report.budgetLevel === "normal"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-rose-700 bg-rose-50 border-rose-200";

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-sm">
      <div className="border-b border-violet-100 bg-violet-50/50 px-5 py-4 sm:px-6">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-600">
          <Brain className="h-3.5 w-3.5" />
          {t.eyebrow}
        </p>
        <h2 className="mt-2 text-base font-semibold text-zinc-950 sm:text-lg">{t.title}</h2>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label={t.invited} value={String(report.invitedCount)} />
          <Metric label={t.response} value={`${report.responseRate}%`} />
          <Metric label={t.accept} value={`${report.acceptanceRate}%`} />
          <Metric label={t.projected} value={`${report.projectedAcceptanceRate}%`} highlight />
        </div>

        <div className={cn("rounded-2xl border px-4 py-3", tone)}>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <CircleDollarSign className="h-4 w-4" />
              {t.budgetScore}
            </span>
            <span className="text-2xl font-semibold tabular-nums">{report.budgetScore}</span>
          </div>
          <p className="mt-2 text-xs leading-5">{t.below(report.marketBelowPercent)}</p>
          {report.suggestedBudget > report.currentBudget ? (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {t.suggestedBudget}: {formatCurrency(report.suggestedBudget)}
            </p>
          ) : null}
        </div>

        {report.reasons.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t.reasons}</p>
            <div className="mt-2 space-y-2">
              {report.reasons.slice(0, 3).map((reason) => (
                <div key={reason.reason} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm">
                  <span className="text-zinc-700">{reason.label}</span>
                  <span className="font-semibold text-zinc-950">
                    {reason.count} · {reason.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <BarChart3 className="h-3.5 w-3.5" />
            {t.suggestions}
          </p>
          <ul className="mt-2 space-y-2">
            {report.recommendations.map((item) => (
              <li key={item} className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-800">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {report.expanding ? (
          <p className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            {t.expanding}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border px-3 py-2", highlight ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-zinc-50")}>
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-950">{value}</p>
    </div>
  );
}
