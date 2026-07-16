"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { BriefFieldLabel } from "@/components/studioos/brand-creative-brief/brand-creative-brief-ui";
import type { BriefSectionsProps } from "@/components/studioos/brand-creative-brief/brand-creative-brief-sections-shared";
import { BrandBudgetAiHero } from "@/components/studioos/brand-budget/brand-budget-ai-hero";
import { BrandBudgetTierGrid } from "@/components/studioos/brand-budget/brand-budget-tier-grid";
import { BrandBudgetValueStrip } from "@/components/studioos/brand-budget/brand-budget-value-strip";
import {
  buildBudgetPricingInsights,
  budgetTierPresentation
} from "@/lib/studioos/brand-budget-pricing-insights";
import { durationSeconds, marketQuoteForBrief } from "@/lib/studioos/brand-market-quote";

export function BrandBudgetStepExperience(props: BriefSectionsProps) {
  const {
    locale,
    form,
    budgetCustom,
    onBudgetCustomChange,
    onBudgetCustomBlur,
    isPending,
    copy: t
  } = props;

  const marketQuote = useMemo(
    () => marketQuoteForBrief(form, locale),
    [
      locale,
      form.videoDuration,
      form.videoDurationCustom,
      form.aspectRatio,
      form.aspectRatioCustom,
      form.resolution,
      form.frameRate,
      form.videoQuantity,
      form.estimatedShotCount,
      form.deliveryTimeline,
      form.budgetRange,
      form.creativeStyles.join(",")
    ]
  );

  const insights = useMemo(
    () => buildBudgetPricingInsights(form, marketQuote, locale),
    [form, marketQuote, locale]
  );
  const presentations = useMemo(() => budgetTierPresentation(locale), [locale]);

  const videoLengthLabel = useMemo(() => {
    const seconds = durationSeconds(form.videoDuration, form.videoDurationCustom);
    if (seconds >= 60 && seconds % 60 === 0) {
      const minutes = seconds / 60;
      return locale === "zh" ? `${minutes} 分钟` : `${minutes} min`;
    }
    return locale === "zh" ? `${seconds} 秒` : `${seconds}s`;
  }, [form.videoDuration, form.videoDurationCustom, locale]);

  return (
    <div className="space-y-6">
      <BrandBudgetAiHero
        locale={locale}
        quote={marketQuote}
        insights={insights}
        videoLengthLabel={videoLengthLabel}
      />

      <BrandBudgetValueStrip locale={locale} insights={insights} recommendedUsd={marketQuote.recommended} />

      <BrandBudgetTierGrid
        locale={locale}
        quote={marketQuote}
        presentations={presentations}
        selectedBudgetRange={form.budgetRange}
        disabled={isPending}
        onSelectTierPrice={onBudgetCustomChange}
      />

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <BriefFieldLabel
          label={locale === "zh" ? "自行调整预算" : "Adjust budget manually"}
        />
        <p className="mb-3 text-xs leading-5 text-zinc-500">
          {locale === "zh"
            ? "如果你希望提高匹配成功率或锁定更高等级创作者，可直接输入目标预算。"
            : "Enter a custom amount if you want stronger matching odds or higher-tier creators."}
        </p>
        <Input
          value={budgetCustom}
          onChange={(e) => onBudgetCustomChange(e.target.value)}
          onBlur={onBudgetCustomBlur}
          placeholder={t.budgetCustomPlaceholder}
          className="h-11 rounded-xl"
          disabled={isPending}
        />
      </section>
    </div>
  );
}
