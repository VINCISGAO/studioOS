"use client";

import type { Locale } from "@/lib/i18n";
import { BudgetSettlementCallout, SettlementUsdCallout } from "@/components/studioos/budget-settlement-callout";
import type { BudgetPricingInsights } from "@/lib/studioos/brand-budget-pricing-insights";
import {
  formatMoneyFromUsd,
  formatStoredBudgetRange,
  budgetEscrowVarianceNote
} from "@/lib/money/display-money";
import type { StoredProject } from "@/lib/project-types";
import { parseBudgetMidpoint } from "@/lib/studioos/brand-checkout-utils";
import { resolveBrandPublishConfirmationSummary } from "@/lib/studioos/brand-publish-confirmation";
import { CalendarDays, Check, Shield, Sparkles } from "lucide-react";

const PLATFORM_FEE_RATE = 0.08;

const copy = {
  en: {
    escrowTitle: "Escrow payment",
    estimatedBudget: "Estimated budget",
    confidence: "AI confidence",
    delivery: "Delivery",
    recommendedStudio: "Recommended tier",
    secureEscrow: "Secure escrow",
    escrowHint: "Funds stay protected until you approve delivery.",
    creatorNote: "Creators submit creative ideas after payment."
  },
  zh: {
    escrowTitle: "托管付款",
    estimatedBudget: "预估预算",
    confidence: "AI 置信度",
    delivery: "交付周期",
    recommendedStudio: "推荐档位",
    secureEscrow: "安全托管",
    escrowHint: "确认交付前资金始终受平台保护。",
    creatorNote: "付款后由匹配创作者提交创意方向。"
  }
} as const;

export function BrandCampaignStep3BudgetSidebar({
  locale,
  project,
  delivery,
  budgetRange,
  budgetCustom = "",
  insights,
  recommendedUsd,
  recommendedTierLabel = "Professional"
}: {
  locale: Locale;
  project: StoredProject;
  delivery: string;
  budgetRange: string;
  budgetCustom?: string;
  insights?: BudgetPricingInsights | null;
  recommendedUsd?: number;
  recommendedTierLabel?: string;
}) {
  const t = copy[locale];
  const summary = resolveBrandPublishConfirmationSummary(project, locale, null, budgetRange);
  const selectedMidpoint = parseBudgetMidpoint(budgetRange);
  const displayBudgetUsd = selectedMidpoint > 0 ? selectedMidpoint : recommendedUsd ?? 0;
  const escrowUsd = displayBudgetUsd > 0 ? Math.round(displayBudgetUsd * (1 - PLATFORM_FEE_RATE)) : 0;
  const budgetLabel = budgetRange.trim()
    ? formatStoredBudgetRange(budgetRange, locale)
    : recommendedUsd
      ? formatMoneyFromUsd(recommendedUsd, locale)
      : summary.budgetRange;
  const varianceNote = budgetEscrowVarianceNote(displayBudgetUsd, locale, budgetCustom);
  const fmt = (amount: number) => formatMoneyFromUsd(amount, locale);

  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <section className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-white p-5 shadow-sm">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
          <Shield className="h-4 w-4" />
          {t.escrowTitle}
        </p>

        <div className="mt-4 space-y-3 border-b border-violet-100/80 pb-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-500">{t.estimatedBudget}</span>
            <span className="font-semibold text-zinc-950">{budgetLabel}</span>
          </div>
          {insights ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                {t.confidence}
              </span>
              <span className="font-semibold text-zinc-950">{insights.confidencePercent}%</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
              {t.delivery}
            </span>
            <span className="font-semibold text-zinc-950">{insights?.deliveryLabel ?? delivery}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-500">{t.recommendedStudio}</span>
            <span className="font-semibold text-zinc-950">{recommendedTierLabel}</span>
          </div>
        </div>

        <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
          {escrowUsd > 0 ? fmt(escrowUsd) : "—"}
        </p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{t.escrowHint}</p>

        {displayBudgetUsd > 0 ? (
          <div className="mt-3 space-y-1 rounded-xl bg-white/80 px-3 py-2 text-xs text-zinc-600 ring-1 ring-violet-100">
            <div className="flex justify-between gap-3">
              <span>{locale === "zh" ? "项目预算" : "Project budget"}</span>
              <span>{fmt(displayBudgetUsd)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>{locale === "zh" ? "平台服务费 (8%)" : "Platform fee (8%)"}</span>
              <span>-{fmt(Math.round(displayBudgetUsd * PLATFORM_FEE_RATE))}</span>
            </div>
          </div>
        ) : null}

        {varianceNote ? (
          <BudgetSettlementCallout message={varianceNote} className="mt-3" />
        ) : (
          <SettlementUsdCallout locale={locale} className="mt-3" />
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-zinc-950">{summary.schemeTitle}</p>
        {summary.schemeSummary ? (
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            {summary.isCreatorSubmission ? t.creatorNote : summary.schemeSummary}
          </p>
        ) : null}
        <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          {t.secureEscrow}
        </p>
      </section>
    </aside>
  );
}
