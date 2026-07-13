"use client";

import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";

const copy = {
  en: {
    reference: "Transfer reference (optional)",
    referencePlaceholder: "e.g. Campaign transfer ID",
    payDemo: "Confirm payment & start matching",
    payCard: "Pay with card (Stripe)",
    payNow: "Pay now"
  },
  zh: {
    reference: "转账备注（选填）",
    referencePlaceholder: "例如：Campaign 转账单号",
    payDemo: "确认付款并开始匹配",
    payCard: "信用卡付款（Stripe）",
    payNow: "立即付款"
  }
} as const;

function payLabel(locale: Locale, method: PayoutMethodType) {
  const t = copy[locale];
  return method === "bank_wire" ? t.payCard : t.payDemo;
}

export function BrandCheckoutPayReference({
  locale,
  formId,
  reference,
  onReferenceChange
}: {
  locale: Locale;
  formId: string;
  reference: string;
  onReferenceChange: (value: string) => void;
}) {
  const t = copy[locale];

  return (
    <div className="rounded-[1.5rem] border border-zinc-200/80 bg-white p-5 shadow-sm">
      <label htmlFor={`${formId}-reference`} className="text-sm font-semibold text-zinc-900">
        {t.reference}
      </label>
      <Input
        id={`${formId}-reference`}
        value={reference}
        onChange={(event) => onReferenceChange(event.target.value)}
        placeholder={t.referencePlaceholder}
        className="mt-3 h-11 rounded-[10px] border-zinc-200 bg-zinc-50/70"
      />
    </div>
  );
}

export function BrandCheckoutPayButton({
  locale,
  formId,
  method,
  pending,
  compact = false
}: {
  locale: Locale;
  formId: string;
  method: PayoutMethodType;
  pending: boolean;
  compact?: boolean;
}) {
  const label = payLabel(locale, method);

  return (
    <Button
      type="submit"
      form={formId}
      size="lg"
      disabled={pending}
      className={
        compact
          ? "h-11 shrink-0 rounded-xl bg-violet-600 px-6 text-sm font-semibold shadow-[0_14px_26px_rgba(124,58,237,0.25)] hover:bg-violet-700"
          : "h-12 w-full rounded-xl bg-violet-600 text-sm font-semibold shadow-[0_14px_26px_rgba(124,58,237,0.25)] hover:bg-violet-700"
      }
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}

/** @deprecated Use BrandCheckoutPayReference + BrandCheckoutPayButton */
export function BrandCheckoutPayAction({
  locale,
  formId,
  method,
  reference,
  onReferenceChange,
  pending
}: {
  locale: Locale;
  formId: string;
  method: PayoutMethodType;
  reference: string;
  onReferenceChange: (value: string) => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-4">
      <BrandCheckoutPayReference
        locale={locale}
        formId={formId}
        reference={reference}
        onReferenceChange={onReferenceChange}
      />
      <BrandCheckoutPayButton locale={locale} formId={formId} method={method} pending={pending} />
    </div>
  );
}
