"use client";

import type { Locale } from "@/lib/i18n";
import type { BudgetPricingInsights } from "@/lib/studioos/brand-budget-pricing-insights";
import type { MarketQuoteResult } from "@/lib/studioos/brand-market-quote";
import { formatMoneyFromUsd } from "@/lib/money/display-money";
import { cn } from "@/lib/utils";
import { Bot, Sparkles } from "lucide-react";

const copy = {
  en: {
    eyebrow: "AI Pricing Recommendation",
    title: "Recommended budget",
    confidence: "Confidence",
    why: "Why this budget?",
    analysisTitle: "AI Pricing Analysis",
    analysisBased: "Based on",
    similar: "Similar campaigns",
    resolution: "Resolution",
    duration: "Duration",
    delivery: "Delivery window",
    category: "Brand category"
  },
  zh: {
    eyebrow: "AI 推荐预算",
    title: "推荐预算",
    confidence: "置信度",
    why: "为什么推荐？",
    analysisTitle: "AI 预算分析",
    analysisBased: "基于",
    similar: "类似 Campaign",
    resolution: "分辨率",
    duration: "时长",
    delivery: "交付周期",
    category: "品牌类别"
  }
} as const;

function StarRow({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-400" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={cn("text-sm", index < count ? "opacity-100" : "opacity-25")}>
          ★
        </span>
      ))}
    </span>
  );
}

export function BrandBudgetAiHero({
  locale,
  quote,
  insights,
  videoLengthLabel
}: {
  locale: Locale;
  quote: MarketQuoteResult;
  insights: BudgetPricingInsights;
  videoLengthLabel: string;
}) {
  const t = copy[locale];
  const fmt = (amount: number) => formatMoneyFromUsd(amount, locale);

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_20px_70px_rgba(88,28,135,0.1)]">
      <div className="bg-[radial-gradient(circle_at_10%_0%,rgba(124,58,237,0.18),transparent_32%),linear-gradient(135deg,#faf5ff_0%,#ffffff_55%,#f8fafc_100%)] px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/25">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">{t.eyebrow}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <StarRow count={5} />
                  <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    {locale === "zh" ? "推荐" : "Recommended"}
                  </span>
                </div>
                <p className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-[2.75rem]">
                  {fmt(quote.recommended)}
                </p>
                <p className="mt-2 text-sm text-zinc-500">{quote.status}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-zinc-950">{t.why}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {insights.reasons.map((reason) => (
                  <li
                    key={reason.id}
                    className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm text-zinc-700 ring-1 ring-violet-100"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-600">
                      ✓
                    </span>
                    <span>{reason.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-violet-100 lg:w-72">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.confidence}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">{insights.confidencePercent}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600"
                style={{ width: `${insights.confidencePercent}%` }}
              />
            </div>
            <div className="mt-5 space-y-2 border-t border-zinc-100 pt-4 text-xs text-zinc-600">
              <p className="font-semibold text-zinc-900">{t.analysisTitle}</p>
              <p className="text-zinc-500">{t.analysisBased}</p>
              {[
                [t.similar, String(insights.comparableProjectCount)],
                [t.resolution, quote.resolutionLabel],
                [t.duration, videoLengthLabel],
                [t.delivery, insights.deliveryLabel],
                [t.category, locale === "zh" ? "品牌广告" : "Brand advertising"]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-violet-500" />
                    {label}
                  </span>
                  <span className="font-semibold text-zinc-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
