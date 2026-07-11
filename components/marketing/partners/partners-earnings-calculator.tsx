"use client";

import { useMemo, useState } from "react";
import {
  PARTNER_REFERRAL_SHARE_OF_PLATFORM_FEE,
  type PartnerCommissionTier,
  type PartnerCustomerType
} from "@/features/partner-program/partner-program.constants";
import { calculatePlatformFeeSplit } from "@/features/pricing/platform-service-fee.constants";
import { partnersText } from "@/lib/marketing/partners-copy";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export function PartnersEarningsCalculator({
  locale,
  tiers,
  className
}: {
  locale: Locale;
  tiers: PartnerCommissionTier[];
  className?: string;
}) {
  const t = partnersText(locale);
  const [customerType, setCustomerType] = useState<PartnerCustomerType>("standard");
  const [orderAmount, setOrderAmount] = useState("10000");

  const selectedTier = tiers.find((tier) => tier.id === customerType) ?? tiers[0];
  const parsedAmount = Number(orderAmount.replace(/,/g, ""));
  const split = useMemo(
    () => calculatePlatformFeeSplit(parsedAmount, selectedTier?.platformServiceFeeRate ?? 0),
    [parsedAmount, selectedTier?.platformServiceFeeRate]
  );

  return (
    <div
      className={cn(
        "flex flex-col rounded-[1.75rem] border border-zinc-200/80 bg-white p-5 shadow-[0_14px_40px_-32px_rgba(0,0,0,0.18)] sm:p-6",
        className
      )}
    >
      <h3 className="text-base font-semibold text-zinc-950">{t.calculatorTitle}</h3>
      <label className="mt-5 block text-sm font-medium text-zinc-700">
        {t.calculatorLabels.customerType}
        <select
          value={customerType}
          onChange={(event) => setCustomerType(event.target.value as PartnerCustomerType)}
          className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        >
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {locale === "zh" ? tier.labelZh : tier.labelEn}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block text-sm font-medium text-zinc-700">
        {t.calculatorLabels.orderAmount}
        <input
          type="number"
          min={0}
          step={100}
          value={orderAmount}
          onChange={(event) => setOrderAmount(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        />
      </label>
      <div className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
        <div>
          <p className="text-xs text-zinc-500">{t.calculatorLabels.platformServiceFee}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {selectedTier?.platformServiceFeeRate ?? 0}%
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">{t.calculatorLabels.partnerShare}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {PARTNER_REFERRAL_SHARE_OF_PLATFORM_FEE}% {locale === "zh" ? "（平台服务费）" : "(of platform fee)"}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">{t.calculatorLabels.platformFeeAmount}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            ${split.platformFee.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")} {t.calculatorLabels.currency}
          </p>
        </div>
      </div>
      <div className="mt-auto rounded-2xl bg-violet-50 px-4 py-5 text-center">
        <p className="text-sm text-violet-700">{t.calculatorLabels.estimatedEarnings}</p>
        <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-violet-700">
          ${split.partnerReferral.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}{" "}
          {t.calculatorLabels.currency}
        </p>
      </div>
    </div>
  );
}
