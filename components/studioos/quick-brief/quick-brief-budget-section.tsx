"use client";

import { useMemo } from "react";
import type { BriefFormState } from "@/components/studioos/brand-campaign-step-brief";
import {
  QuickBriefSectionCard,
  QuickBriefSectionHeader
} from "@/components/studioos/quick-brief/quick-brief-section-header";
import type { Locale } from "@/lib/i18n";
import { marketQuoteForBrief } from "@/lib/studioos/brand-market-quote";
import {
  QUICK_BUDGET_STOPS,
  quickBriefCopy,
  quickBudgetCurrentLabel,
  quickBudgetSliderMaxLabel,
  quickBudgetSliderMinLabel
} from "@/lib/studioos/quick-brief-copy";

export function QuickBriefBudgetSection({
  locale,
  form,
  budgetIndex,
  onBudgetIndexChange,
  disabled,
  stepNumber = 3
}: {
  locale: Locale;
  form: BriefFormState;
  budgetIndex: number;
  onBudgetIndexChange: (index: number) => void;
  disabled?: boolean;
  stepNumber?: number | null;
}) {
  const t = quickBriefCopy(locale);
  const maxIndex = QUICK_BUDGET_STOPS.length - 1;
  const progress = maxIndex > 0 ? budgetIndex / maxIndex : 0;
  const currentLabel = quickBudgetCurrentLabel(budgetIndex, locale);
  const marketQuote = useMemo(
    () => marketQuoteForBrief(form, locale),
    [
      locale,
      form.videoDuration,
      form.videoDurationCustom,
      form.resolution,
      form.videoQuantity,
      form.deliveryTimeline,
      form.creativeStyles.join(",")
    ]
  );

  return (
    <QuickBriefSectionCard className="min-w-0 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      {stepNumber != null ? (
        <QuickBriefSectionHeader number={stepNumber} title={t.budgetLabel} />
      ) : (
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">{t.budgetLabel}</p>
      )}

      <div className="space-y-5 py-2">
        <p className="text-center text-4xl font-semibold tabular-nums tracking-tight text-zinc-950 sm:text-[2.75rem]">
          {currentLabel}
        </p>

        <div className="space-y-2">
          <div className="relative px-1 py-2">
            <div className="absolute inset-x-1 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-200" />
            <div
              className="absolute left-1 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-violet-500 transition-[width] duration-150"
              style={{ width: `calc((100% - 0.5rem) * ${progress})` }}
            />
            <input
              type="range"
              min={0}
              max={maxIndex}
              step={1}
              value={budgetIndex}
              disabled={disabled}
              onChange={(event) => onBudgetIndexChange(Number(event.target.value))}
              className="quick-brief-range relative z-10 h-10 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-1 text-xs text-zinc-400">
            <span>{quickBudgetSliderMinLabel(locale)}</span>
            <span>{quickBudgetSliderMaxLabel(locale)}</span>
          </div>
          <p className="text-center text-[11px] text-zinc-400">{t.budgetUsdNote}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-white px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">{t.budgetAiTitle}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-950">{marketQuote.rangeUsd}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.budgetAiHint}</p>
      </div>
    </QuickBriefSectionCard>
  );
}
