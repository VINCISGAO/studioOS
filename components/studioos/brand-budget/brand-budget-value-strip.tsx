"use client";

import type { Locale } from "@/lib/i18n";
import type { BudgetPricingInsights } from "@/lib/studioos/brand-budget-pricing-insights";
import { formatMoneyFromUsd } from "@/lib/money/display-money";

const copy = {
  en: {
    savings: "Estimated savings vs traditional production",
    efficiency: "Estimated production efficiency",
    revisions: "Estimated revision rounds reduced"
  },
  zh: {
    savings: "预计比传统广告节省",
    efficiency: "预计制作效率提升",
    revisions: "预计修改轮次减少"
  }
} as const;

export function BrandBudgetValueStrip({
  locale,
  insights,
  recommendedUsd
}: {
  locale: Locale;
  insights: BudgetPricingInsights;
  recommendedUsd: number;
}) {
  const t = copy[locale];
  const fmt = (amount: number) => formatMoneyFromUsd(amount, locale);

  const items = [
    {
      label: t.savings,
      value: `${insights.savingsPercent}%`,
      detail: locale === "zh" ? `传统约 ${fmt(insights.traditionalEstimateUsd)}` : `Traditional ~${fmt(insights.traditionalEstimateUsd)}`
    },
    {
      label: t.efficiency,
      value: `${insights.efficiencyMultiplier}×`,
      detail: locale === "zh" ? `推荐预算 ${fmt(recommendedUsd)}` : `Recommended ${fmt(recommendedUsd)}`
    },
    {
      label: t.revisions,
      value: `${insights.revisionReductionPercent}%`,
      detail: locale === "zh" ? "AI 协同减少来回修改" : "AI collaboration reduces rework"
    }
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-4 shadow-sm"
        >
          <p className="text-xs font-medium text-zinc-500">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{item.value}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{item.detail}</p>
        </div>
      ))}
    </section>
  );
}
