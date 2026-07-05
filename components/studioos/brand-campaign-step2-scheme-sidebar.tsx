"use client";

import { SchemeBudgetDonut } from "@/components/studioos/brand-campaign-step2-scheme-charts";
import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import {
  buildSchemeDisplayMetrics,
  type SchemeDisplayMetrics
} from "@/lib/studioos/brand-campaign-scheme-metrics";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Download, Star } from "lucide-react";

const copy = {
  en: {
    compare: "Scheme comparison",
    customCompare: "Custom comparison",
    scheme: "Scheme",
    aiScore: "AI score",
    ctr: "CTR lift",
    conversion: "Conversion",
    difficulty: "Difficulty",
    budget: "Budget",
    platforms: "Platforms",
    recommended: "Recommended",
    budgetBreakdown: "Budget breakdown",
    expected: "Expected results",
    avgWatch: "Avg. watch time",
    engagement: "Engagement rate",
    cpm: "CPM forecast",
    roi: "ROI forecast",
    export: "Export all schemes (PDF)"
  },
  zh: {
    compare: "方案对比",
    customCompare: "自定义对比",
    scheme: "方案",
    aiScore: "AI 评分",
    ctr: "CTR 提升",
    conversion: "转化提升",
    difficulty: "制作难度",
    budget: "预算",
    platforms: "平台",
    recommended: "推荐",
    budgetBreakdown: "预算分解",
    expected: "预期效果",
    avgWatch: "平均观看时长",
    engagement: "互动率",
    cpm: "CPM 预测",
    roi: "ROI 预测",
    export: "导出全部方案 (PDF)"
  }
} as const;

const DEFAULT_PLATFORMS = ["TikTok", "Meta"];

function DifficultyStars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn("h-3 w-3", index < count ? "fill-amber-400 text-amber-400" : "text-zinc-200")}
        />
      ))}
    </span>
  );
}

export function BrandCampaignStep2SchemeSidebar({
  locale,
  directions,
  selectedId,
  platforms,
  fallbackBudget
}: {
  locale: Locale;
  directions: CreativeDirection[];
  selectedId: string | null;
  platforms: string[];
  fallbackBudget: number;
}) {
  const t = copy[locale];
  const metricsList = directions.map((direction, index) =>
    buildSchemeDisplayMetrics(direction, index, locale, fallbackBudget)
  );
  const selectedIndex = Math.max(
    0,
    directions.findIndex((direction) => direction.id === selectedId)
  );
  const selectedMetrics = metricsList[selectedIndex] ?? metricsList[0];
  const platformLabel = (platforms.length ? platforms : DEFAULT_PLATFORMS).slice(0, 2).join(", ");

  if (!selectedMetrics) return null;

  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-950">{t.compare}</h3>
          <button type="button" className="text-xs font-medium text-violet-600 hover:text-violet-700">
            {t.customCompare}
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-500">
                <th className="pb-2 pr-2 font-medium">{t.scheme}</th>
                {metricsList.map((metrics, colIndex) => (
                  <th
                    key={metrics.label}
                    className={cn(
                      "px-1 pb-2 text-center font-medium",
                      colIndex === selectedIndex ? "rounded-t-lg bg-violet-50 text-violet-700" : "",
                      metrics.recommended && colIndex !== selectedIndex && "text-violet-700"
                    )}
                  >
                    {metrics.label}
                    {metrics.recommended ? (
                      <span className="mt-0.5 block text-[10px] font-normal text-violet-600">{t.recommended}</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-zinc-700">
              {[
                { label: t.aiScore, render: (m: SchemeDisplayMetrics) => m.aiScore },
                { label: t.ctr, render: (m: SchemeDisplayMetrics) => `+${m.ctrLift}%` },
                { label: t.conversion, render: (m: SchemeDisplayMetrics) => `+${m.conversionLift}%` },
                {
                  label: t.difficulty,
                  render: (m: SchemeDisplayMetrics) => m.difficultyStars,
                  stars: true
                },
                { label: t.budget, render: (m: SchemeDisplayMetrics) => `$${m.budgetTotal}` }
              ].map((row) => (
                <tr key={row.label} className="border-b border-zinc-50 last:border-0">
                  <td className="py-2 pr-2 text-zinc-500">{row.label}</td>
                  {metricsList.map((metrics, colIndex) => (
                    <td
                      key={`${row.label}-${metrics.label}`}
                      className={cn(
                        "px-1 py-2 text-center font-medium",
                        colIndex === selectedIndex && "bg-violet-50 text-violet-800"
                      )}
                    >
                      {row.stars ? <DifficultyStars count={row.render(metrics) as number} /> : row.render(metrics)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-2 text-zinc-500">{t.platforms}</td>
                {metricsList.map((metrics, colIndex) => (
                  <td
                    key={`platforms-${metrics.label}`}
                    className={cn(
                      "px-1 py-2 text-center text-[10px] leading-4",
                      colIndex === selectedIndex && "rounded-b-lg bg-violet-50 text-violet-800"
                    )}
                  >
                    {platformLabel}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-950">
          {t.budgetBreakdown} · {t.scheme} {selectedMetrics.label}
        </h3>
        <div className="mt-4">
          <SchemeBudgetDonut total={selectedMetrics.budgetTotal} slices={selectedMetrics.budgetSlices} locale={locale} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-950">
          {t.expected} · {t.scheme} {selectedMetrics.label}
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { label: t.avgWatch, value: `${selectedMetrics.avgWatchSec}s` },
            { label: t.engagement, value: `${selectedMetrics.engagementRate}%` },
            { label: t.cpm, value: `$${selectedMetrics.cpmForecast}` },
            { label: t.roi, value: `${selectedMetrics.roi}x` }
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2.5">
              <p className="text-[10px] text-zinc-500">{item.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-950">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
      >
        <Download className="h-4 w-4" />
        {t.export}
      </button>
    </aside>
  );
}
