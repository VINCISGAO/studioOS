"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bitcoin,
  Check,
  Copy,
  Loader2,
  Lock,
  MessageCircle,
  Shield,
  Smartphone,
  Wallet
} from "lucide-react";
import { submitDepositPaymentAction } from "@/app/deposit-actions";
import { CreatorDepositPendingCard } from "@/components/studioos/creator-deposit-pending-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import { tCertified } from "@/lib/studioos/deposit-copy";
import type { CreatorDepositSnapshot } from "@/lib/studioos/deposit-types";
import {
  DEPOSIT_PAYMENT_METHODS,
  getPlatformCorporateAccount,
  paymentMethodLabel
} from "@/lib/studioos/deposit-utils";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { cn, formatCurrency } from "@/lib/utils";

const copyExtra = {
  en: { copy: "Copy", copied: "Copied" },
  zh: { copy: "复制", copied: "已复制" }
} as const;

const methodIcons: Record<PayoutMethodType, typeof Smartphone> = {
  bank_wire: Wallet,
  paypal: Wallet,
  alipay: Smartphone,
  wechat: MessageCircle,
  crypto: Bitcoin
};

export function CreatorDepositPaymentSection({
  locale,
  creatorId,
  snapshot,
  submitted,
  scrollToPayment
}: {
  locale: Locale;
  creatorId: string;
  snapshot: CreatorDepositSnapshot;
  submitted?: boolean;
  scrollToPayment?: boolean;
}) {
  const t = tCertified(locale);
  const extra = copyExtra[locale];
  const router = useRouter();
  const [method, setMethod] = useState<PayoutMethodType>("alipay");
  const [reference, setReference] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const account = useMemo(() => getPlatformCorporateAccount(method, creatorId, locale), [method, creatorId, locale]);

  useEffect(() => {
    if (!scrollToPayment) return;
    const node = document.getElementById("deposit-payment");
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollToPayment]);

  function copyValue(key: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("lang", locale);
    formData.set("payment_method", method);
    if (reference.trim()) {
      formData.set("payment_reference", reference.trim());
    }
    startTransition(async () => {
      await submitDepositPaymentAction(formData);
      router.refresh();
    });
  }

  if (submitted || snapshot.pending_payment) {
    return (
      <div id="deposit-payment">
        <CreatorDepositPendingCard locale={locale} snapshot={snapshot} submitted={submitted} />
      </div>
    );
  }

  return (
    <section
      id="deposit-payment"
      className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]"
    >
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold tracking-tight text-zinc-950">{t.paySection}</h2>
        <p className="mt-0.5 text-sm text-zinc-500">{t.secureTransfer}</p>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DEPOSIT_PAYMENT_METHODS.map((type) => {
            const Icon = methodIcons[type];
            const active = method === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setMethod(type)}
                className={cn(
                  "relative flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition",
                  active
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-sm"
                    : "border-zinc-200 bg-zinc-50/40 text-zinc-600 hover:border-zinc-300 hover:bg-white"
                )}
              >
                {active ? (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                ) : null}
                <Icon className={cn("h-5 w-5", active ? "text-emerald-600" : "text-zinc-500")} />
                {paymentMethodLabel(type, locale)}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-zinc-500" />
                <p className="text-sm font-semibold text-zinc-950">{t.corporateAccount}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                {t.paymentLabel}
              </span>
              <span className="text-2xl font-semibold tracking-tight text-zinc-950">
                {formatCurrency(snapshot.amount_usd)}
              </span>
            </div>
          </div>

          <dl className="mt-4 space-y-2">
            {account.details.map((row) => (
              <div
                key={row.key}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <dt className="text-xs font-medium text-zinc-500">{row.key}</dt>
                <dd className="flex min-w-0 items-center gap-2 sm:justify-end">
                  <span className="break-all text-sm font-medium text-zinc-900">{row.value}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 rounded-lg px-2.5 text-xs text-zinc-600"
                    onClick={() => copyValue(row.key, row.value)}
                  >
                    {copiedKey === row.key ? (
                      extra.copied
                    ) : (
                      <>
                        <Copy className="mr-1 h-3.5 w-3.5" />
                        {extra.copy}
                      </>
                    )}
                  </Button>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_reference" className="text-zinc-700">
            {t.reference}
          </Label>
          <Input
            id="payment_reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder={locale === "zh" ? "转账单号 / 哈希 (选填)" : "Transfer ID / hash (optional)"}
            className="h-11 rounded-xl border-zinc-200 bg-white"
          />
          <p className="text-xs leading-5 text-zinc-500">{t.referenceHint}</p>
        </div>

        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-xl bg-zinc-900 text-sm font-medium hover:bg-zinc-800"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {t.submit}
        </Button>
      </div>
    </section>
  );
}
