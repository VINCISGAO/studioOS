"use client";

import type { Locale } from "@/lib/i18n";
import type { BudgetTierPresentation } from "@/lib/studioos/brand-budget-pricing-insights";
import type { MarketQuoteResult } from "@/lib/studioos/brand-market-quote";
import {
  convertUsdToDisplayAmount,
  formatMoneyFromUsd,
  parseStoredMoneyRange
} from "@/lib/money/display-money";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Budget options",
    subtitle: "Not satisfied? Pick another tier or enter a custom amount below.",
    choose: "Choose",
    custom: "Custom"
  },
  zh: {
    title: "预算选项",
    subtitle: "不满意？可选择其他档位，或在下方自行调整预算。",
    choose: "选择",
    custom: "定制"
  }
} as const;

function StarRow({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-400" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={cn("text-xs", index < count ? "opacity-100" : "opacity-25")}>
          ★
        </span>
      ))}
    </span>
  );
}

export function BrandBudgetTierGrid({
  locale,
  quote,
  presentations,
  selectedBudgetRange,
  disabled,
  onSelectTierPrice
}: {
  locale: Locale;
  quote: MarketQuoteResult;
  presentations: Record<string, BudgetTierPresentation>;
  selectedBudgetRange: string;
  disabled?: boolean;
  onSelectTierPrice: (displayAmount: string) => void;
}) {
  const t = copy[locale];
  const fmt = (amount: number) => formatMoneyFromUsd(amount, locale);
  const selected = parseStoredMoneyRange(selectedBudgetRange);

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">{t.title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quote.tiers.map((tier) => {
          const presentation = presentations[tier.key];
          if (!presentation) return null;
          const isSelected = selected?.min === tier.price && selected?.max === tier.price;
          const isEnterprise = tier.key === "enterprise";

          return (
            <button
              key={tier.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTierPrice(String(convertUsdToDisplayAmount(tier.price, locale)))}
              className={cn(
                "group flex h-full flex-col rounded-3xl border p-5 text-left transition",
                isSelected
                  ? "border-violet-500 bg-violet-50/70 shadow-[0_16px_40px_rgba(124,58,237,0.16)] ring-2 ring-violet-200"
                  : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-zinc-950">{tier.label}</p>
                  <StarRow count={presentation.stars} />
                </div>
                {presentation.badge ? (
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {presentation.badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                {isEnterprise && locale === "zh" ? t.custom : fmt(tier.price)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{presentation.tagline}</p>

              <ul className="mt-5 flex-1 space-y-2 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
                {presentation.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 text-violet-600">✔</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <span
                className={cn(
                  "mt-5 inline-flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  isSelected
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-100 text-zinc-800 group-hover:bg-violet-600 group-hover:text-white"
                )}
              >
                {t.choose}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
