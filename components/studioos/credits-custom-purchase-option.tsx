"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import type { CreditCustomPurchaseTermsView } from "@/features/credit-wallet/credit-wallet.types";
import type { Locale } from "@/lib/i18n";
import { formatAmountMinor } from "@/lib/credits/currency-minor-units";
import { intlLocaleForCurrency } from "@/lib/credits/market-currency";
import { cn } from "@/lib/utils";

function computeCustomAmountMinor(credits: number, terms: CreditCustomPurchaseTermsView) {
  return Math.max(
    1,
    Math.round((credits / terms.referenceBaseCredits) * terms.referenceAmountMinor)
  );
}

export function CreditsCustomPurchaseOption({
  locale,
  selected,
  terms,
  customCredits,
  onSelect,
  onCreditsChange
}: {
  locale: Locale;
  selected: boolean;
  terms: CreditCustomPurchaseTermsView;
  customCredits: number;
  onSelect: () => void;
  onCreditsChange: (value: number) => void;
}) {
  const zh = locale === "zh";
  const displayPrice = useMemo(() => {
    const amountMinor = computeCustomAmountMinor(customCredits, terms);
    return formatAmountMinor(
      terms.currency,
      amountMinor,
      intlLocaleForCurrency(terms.currency, locale)
    );
  }, [customCredits, locale, terms]);

  return (
    <div
      className={cn(
        "rounded-xl border transition",
        selected
          ? "border-violet-500 bg-violet-50/30 shadow-[0_0_0_1px_rgba(124,58,237,0.35)]"
          : "border-zinc-200"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="relative w-full px-4 py-3.5 text-left"
      >
        {selected ? (
          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
        ) : null}
        <div className="flex items-start justify-between gap-4 pr-8">
          <div>
            <span className="font-semibold text-zinc-950">{zh ? "自定义数量" : "Custom amount"}</span>
            <p className="mt-1 text-sm text-zinc-500">
              {zh
                ? `按 ${terms.referencePackageName} 单价计价，不含赠送 Token`
                : `Priced at the ${terms.referencePackageName} unit rate · no bonus Token`}
            </p>
          </div>
          <div className="shrink-0 text-base font-semibold tabular-nums text-zinc-950">{displayPrice}</div>
        </div>
      </button>

      {selected ? (
        <div className="border-t border-violet-100 px-4 pb-4 pt-3">
          <label className="text-xs font-medium text-zinc-500" htmlFor="custom-credit-amount">
            {zh ? "购买 Token 数量" : "Token amount"}
          </label>
          <input
            id="custom-credit-amount"
            type="number"
            min={terms.minCredits}
            max={terms.maxCredits}
            step={1}
            inputMode="numeric"
            value={customCredits}
            onChange={(event) => onCreditsChange(Number(event.target.value))}
            className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
          />
          <p className="mt-2 text-xs leading-5 text-zinc-400">
            {zh
              ? `可填写 ${terms.minCredits.toLocaleString()}–${terms.maxCredits.toLocaleString()} Token`
              : `Enter ${terms.minCredits.toLocaleString()}–${terms.maxCredits.toLocaleString()} Token`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function isValidCustomCreditAmount(credits: number, terms: CreditCustomPurchaseTermsView) {
  return (
    Number.isInteger(credits) &&
    credits >= terms.minCredits &&
    credits <= terms.maxCredits
  );
}
