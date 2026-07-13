"use client";

import type { Locale } from "@/lib/i18n";
import { BudgetSettlementCallout, SettlementUsdCallout } from "@/components/studioos/budget-settlement-callout";
import {
  formatMoneyFromUsd,
  formatStoredBudgetRange,
  budgetEscrowVarianceNote
} from "@/lib/money/display-money";
import type { StoredProject } from "@/lib/project-types";
import { parseBudgetMidpoint } from "@/lib/studioos/brand-checkout-utils";
import { resolveBrandPublishConfirmationSummary } from "@/lib/studioos/brand-publish-confirmation";
import { CalendarDays, Clapperboard, Shield, Wallet } from "lucide-react";

const copy = {
  en: {
    summary: "Payment summary",
    scheme: "Selected plan",
    delivery: "Delivery",
    budget: "Your budget",
    escrow: "Escrow invoice",
    escrowHint: "Held until you approve delivery",
    creatorNote: "Creators submit creative ideas after payment."
  },
  zh: {
    summary: "付款摘要",
    scheme: "已选方案",
    delivery: "交付周期",
    budget: "提交预算",
    escrow: "托管账单",
    escrowHint: "确认交付后再释放款项",
    creatorNote: "付款后由匹配创作者提交创意方向。"
  }
} as const;

export function BrandCampaignStep3BudgetSidebar({
  locale,
  project,
  delivery,
  budgetRange,
  budgetCustom = ""
}: {
  locale: Locale;
  project: StoredProject;
  delivery: string;
  budgetRange: string;
  budgetCustom?: string;
}) {
  const t = copy[locale];
  const summary = resolveBrandPublishConfirmationSummary(project, locale, null, budgetRange);
  const escrowUsd = parseBudgetMidpoint(budgetRange);
  const budgetLabel = budgetRange.trim()
    ? formatStoredBudgetRange(budgetRange, locale)
    : summary.budgetRange;
  const varianceNote = budgetEscrowVarianceNote(escrowUsd, locale, budgetCustom);

  return (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-950">{t.summary}</h3>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
              <Clapperboard className="h-3.5 w-3.5 text-violet-500" />
              {t.scheme}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-950">{summary.schemeTitle}</dd>
            {summary.schemeSummary ? (
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {summary.isCreatorSubmission ? t.creatorNote : summary.schemeSummary}
              </p>
            ) : null}
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
              <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
              {t.delivery}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-950">{delivery}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
              <Wallet className="h-3.5 w-3.5 text-violet-500" />
              {t.budget}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-950">{budgetLabel}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/80 via-white to-white p-4 shadow-sm">
        <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <Shield className="h-3.5 w-3.5 text-violet-500" />
          {t.escrow}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
          {escrowUsd > 0 ? formatMoneyFromUsd(escrowUsd, locale) : "—"}
        </p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{t.escrowHint}</p>
        {varianceNote ? (
          <BudgetSettlementCallout message={varianceNote} className="mt-2" />
        ) : (
          <SettlementUsdCallout locale={locale} className="mt-2" />
        )}
      </section>
    </aside>
  );
}
