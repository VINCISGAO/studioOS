"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bitcoin,
  Check,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  MessageCircle,
  Shield,
  Smartphone,
  Wallet,
  X
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
  en: {
    copy: "Copy",
    copied: "Copied",
    payNow: "Pay now",
    checkoutTitle: "Complete certification payment",
    checkoutBody:
      "This will simulate the provider deposit payment in the local environment and activate certification immediately.",
    amountDue: "Amount due",
    selectedMethod: "Payment method",
    changeMethod: "Change method",
    completePayment: "Complete payment",
    processingPayment: "Processing payment...",
    submittingHint: "Payment is being confirmed. Redirecting to your certification celebration."
  },
  zh: {
    copy: "复制",
    copied: "已复制",
    payNow: "去付款",
    checkoutTitle: "完成认证付款",
    checkoutBody: "本地环境会模拟拉起付款，点击完成付款后立即激活认证服务商。",
    amountDue: "应付金额",
    selectedMethod: "支付方式",
    changeMethod: "更换方式",
    completePayment: "完成付款",
    processingPayment: "正在确认付款...",
    submittingHint: "正在确认付款，完成后会跳转到认证成功页面。"
  }
} as const;

const methodIcons: Record<PayoutMethodType, typeof Smartphone> = {
  bank_wire: Wallet,
  paypal: Wallet,
  alipay: Smartphone,
  wechat: MessageCircle,
  crypto: Bitcoin
};

function SubmitPaymentButton({
  label,
  pendingLabel,
  submitting,
  onClick
}: {
  label: string;
  pendingLabel: string;
  submitting: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="lg"
      className="h-12 w-full rounded-xl bg-zinc-900 text-sm font-medium hover:bg-zinc-800"
      disabled={submitting}
      onClick={onClick}
    >
      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
      {submitting ? pendingLabel : label}
    </Button>
  );
}

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
  const [method, setMethod] = useState<PayoutMethodType>("alipay");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentPending, startPaymentTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const account = useMemo(() => getPlatformCorporateAccount(method, creatorId, locale), [method, creatorId, locale]);
  const SelectedMethodIcon = methodIcons[method];

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

  function completeSimulatedPayment() {
    if (!formRef.current || isSubmittingPayment || paymentPending) return;
    setIsSubmittingPayment(true);
    const formData = new FormData(formRef.current);
    startPaymentTransition(async () => {
      await submitDepositPaymentAction(formData);
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

      <form
        ref={formRef}
        action={submitDepositPaymentAction}
        className="space-y-6 p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          completeSimulatedPayment();
        }}
      >
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="payment_method" value={method} />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DEPOSIT_PAYMENT_METHODS.map((type) => {
            const Icon = methodIcons[type];
            const active = method === type;
            return (
              <button
                key={type}
                type="button"
                disabled={isSubmittingPayment}
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
                {formatCurrency(snapshot.amount_usd, locale)}
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
            name="payment_reference"
            placeholder={locale === "zh" ? "转账单号 / 哈希 (选填)" : "Transfer ID / hash (optional)"}
            className="h-11 rounded-xl border-zinc-200 bg-white"
            disabled={isSubmittingPayment}
          />
          <p className="text-xs leading-5 text-zinc-500">{t.referenceHint}</p>
        </div>

        {isSubmittingPayment ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {extra.submittingHint}
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="h-12 w-full rounded-xl bg-zinc-900 text-sm font-medium hover:bg-zinc-800"
          disabled={isSubmittingPayment}
          onClick={() => setCheckoutOpen(true)}
        >
          <CreditCard className="h-4 w-4" />
          {extra.payNow}
        </Button>

        {checkoutOpen ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-950">{extra.checkoutTitle}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">{extra.checkoutBody}</p>
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
                  aria-label={locale === "zh" ? "关闭" : "Close"}
                  disabled={isSubmittingPayment}
                  onClick={() => setCheckoutOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 px-5 py-5">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">{extra.amountDue}</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
                    {formatCurrency(snapshot.amount_usd, locale)}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-medium text-zinc-500">{extra.selectedMethod}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950">
                      <SelectedMethodIcon className="h-4 w-4 text-emerald-600" />
                      {paymentMethodLabel(method, locale)}
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline disabled:opacity-50"
                      disabled={isSubmittingPayment}
                      onClick={() => setCheckoutOpen(false)}
                    >
                      {extra.changeMethod}
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 px-5 py-4">
                <SubmitPaymentButton
                  label={extra.completePayment}
                  pendingLabel={extra.processingPayment}
                  submitting={isSubmittingPayment || paymentPending}
                  onClick={completeSimulatedPayment}
                />
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </section>
  );
}
