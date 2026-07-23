"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { tCertified } from "@/lib/studioos/deposit-copy";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { formatSettlementUsd } from "@/lib/money/display-money";

const copy = {
  en: {
    loading: "Preparing secure checkout…",
    amountDue: "Amount due",
    payNow: "Pay certification deposit",
    processing: "Processing payment…",
    remember: "Remember payment method for next time",
    secure: "Card · Alipay · WeChat Pay · encrypted by Stripe",
    failed: "Payment could not be completed. Please try again.",
    unavailable: "Secure checkout is unavailable. Contact support if this persists."
  },
  zh: {
    loading: "正在加载安全收银台…",
    amountDue: "应付金额",
    payNow: "支付认证保证金",
    processing: "正在处理付款…",
    remember: "记住付款方式，下次更快完成",
    secure: "银行卡 · 支付宝 · 微信支付 · 由 Stripe 加密处理",
    failed: "付款未能完成，请重试。",
    unavailable: "安全收银台暂不可用，如持续出现请联系支持。"
  }
} as const;

type IntentPayload = {
  clientSecret: string;
  paymentIntentId: string;
  amountUsd: number;
  publishableKey: string;
};

function DepositPaymentForm({
  locale,
  amountUsd,
  savePaymentMethod,
  onSavePaymentMethodChange
}: {
  locale: Locale;
  amountUsd: number;
  savePaymentMethod: boolean;
  onSavePaymentMethodChange: (value: boolean) => void;
}) {
  const t = copy[locale];
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    setError(null);

    const returnUrl = withLocale(
      `${creatorPortalRoutes.deposit}?checkout=success&lang=${locale}`,
      locale
    );

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${returnUrl}` },
      redirect: "if_required"
    });

    if (result.error) {
      setError(result.error.message ?? t.failed);
      setSubmitting(false);
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      await fetch("/api/v1/payments/stripe/deposit/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: result.paymentIntent.id })
      }).catch(() => undefined);
      router.push(withLocale(`${creatorPortalRoutes.home}?certified=1`, locale));
      router.refresh();
      return;
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-4">
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: { applePay: "auto", googlePay: "auto" }
          }}
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={savePaymentMethod}
          onChange={(event) => onSavePaymentMethodChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900"
        />
        <div>
          <Label className="text-sm font-medium text-zinc-900">{t.remember}</Label>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{t.secure}</p>
        </div>
      </label>

      {error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={!stripe || !elements || submitting}
        className="h-12 w-full rounded-xl bg-zinc-900 text-sm font-medium hover:bg-zinc-800"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {submitting ? t.processing : `${t.payNow} · ${formatSettlementUsd(amountUsd, locale)}`}
      </Button>
    </form>
  );
}

export function CreatorDepositEmbeddedCheckout({
  locale,
  amountUsd
}: {
  locale: Locale;
  amountUsd: number;
}) {
  const t = copy[locale];
  const certified = tCertified(locale);
  const [intent, setIntent] = useState<IntentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetch("/api/v1/payments/stripe/deposit/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savePaymentMethod })
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          success?: boolean;
          data?: IntentPayload;
          error?: { message?: string };
        };
        if (!response.ok || !payload.success || !payload.data?.clientSecret) {
          throw new Error(payload.error?.message ?? t.unavailable);
        }
        if (!cancelled) {
          setIntent(payload.data);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : t.unavailable);
          setIntent(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [savePaymentMethod, refreshKey, locale]);

  const stripePromise = useMemo(
    () => (intent?.publishableKey ? loadStripe(intent.publishableKey) : null),
    [intent?.publishableKey]
  );

  return (
    <section
      id="deposit-payment"
      className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]"
    >
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">{certified.paySection}</h2>
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">{t.secure}</p>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">{t.amountDue}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {formatSettlementUsd(amountUsd, locale)}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-sm text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.loading}
          </div>
        ) : null}

        {error ? (
          <div className="space-y-3">
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRefreshKey((v) => v + 1)}>
              {locale === "zh" ? "重试" : "Retry"}
            </Button>
          </div>
        ) : null}

        {!loading && intent && stripePromise ? (
          <Elements
            key={`${intent.clientSecret}:${savePaymentMethod ? "save" : "nosave"}`}
            stripe={stripePromise}
            options={{
              clientSecret: intent.clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#18181b",
                  borderRadius: "12px",
                  fontFamily: "system-ui, sans-serif"
                }
              }
            }}
          >
            <DepositPaymentForm
              locale={locale}
              amountUsd={amountUsd}
              savePaymentMethod={savePaymentMethod}
              onSavePaymentMethodChange={setSavePaymentMethod}
            />
          </Elements>
        ) : null}
      </div>
    </section>
  );
}
