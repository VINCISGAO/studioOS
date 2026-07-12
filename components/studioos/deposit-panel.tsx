"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Banknote,
  Bitcoin,
  CheckCircle2,
  Clock3,
  Copy,
  Landmark,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Shield,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap
} from "lucide-react";
import { submitDepositPaymentAction, pollDepositStatusAction } from "@/app/deposit-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { portalChrome } from "@/lib/studioos/product-theme";
import { tCertified } from "@/lib/studioos/deposit-copy";
import type { CreatorDepositSnapshot } from "@/lib/studioos/deposit-types";
import {
  DEPOSIT_PAYMENT_METHODS,
  getPlatformCorporateAccount,
  paymentMethodLabel
} from "@/lib/studioos/deposit-utils";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const benefitIcons = [Sparkles, TrendingUp, Zap, BadgeCheck, LayoutDashboard];

const copyExtra = {
  en: {
    copy: "Copy",
    copied: "Copied",
    status: { pending: "Pending", under_review: "Under review", confirmed: "Confirmed", failed: "Failed" }
  },
  zh: {
    copy: "复制",
    copied: "已复制",
    status: { pending: "待处理", under_review: "审核中", confirmed: "已确认", failed: "失败" }
  }
};

const methodIcons: Record<PayoutMethodType, typeof Landmark> = {
  bank_wire: Landmark,
  paypal: Wallet,
  alipay: Smartphone,
  wechat: MessageCircle,
  crypto: Bitcoin
};

const panelShell =
  "overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]";

const heroShell =
  "relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(13,148,136,0.07),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8faf9_100%)]";

export function DepositPanel({
  locale,
  creatorId,
  snapshot,
  submitted,
  error,
  profileComplete = true
}: {
  locale: Locale;
  creatorId: string;
  snapshot: CreatorDepositSnapshot;
  submitted?: boolean;
  error?: string;
  profileComplete?: boolean;
}) {
  const t = tCertified(locale);
  const extra = copyExtra[locale];
  const router = useRouter();
  const [method, setMethod] = useState<PayoutMethodType>("alipay");
  const [reference, setReference] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const account = useMemo(() => getPlatformCorporateAccount(method, creatorId, locale), [method, creatorId, locale]);

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

  if (snapshot.can_accept_orders) {
    return (
      <div className="space-y-8">
        <section className={cn(heroShell, "p-8 sm:p-10")}>
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className={portalChrome.eyebrow}>{t.eyebrow}</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-teal-700">{t.programName}</p>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                {t.certifiedTitle}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600">{t.certifiedBody}</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs text-zinc-600 ring-1 ring-zinc-200/80">
                <Shield className="h-3.5 w-3.5 text-teal-600" />
                {formatCurrency(snapshot.amount_usd, locale)} {t.paymentLabel} · {t.certifiedSince}{" "}
                {snapshot.paid_at
                  ? new Date(snapshot.paid_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")
                  : "—"}
              </div>
            </div>
          </div>
        </section>

        {!profileComplete ? (
          <section className={cn(panelShell, "p-5 sm:p-6")}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold tracking-tight text-zinc-950">{t.setupProfile}</p>
                <p className="mt-1.5 text-sm leading-6 text-zinc-500">{t.setupProfileBody}</p>
              </div>
              <Button asChild className="h-11 shrink-0 rounded-lg px-6">
                <Link href={withLocale("/studio/profile?onboarding=1", locale)}>{t.setupProfileCta}</Link>
              </Button>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <RefundPolicy locale={locale} />
          <ProgramBenefits locale={locale} compact />
        </div>

        {snapshot.payments.length > 0 ? (
          <DepositHistory locale={locale} payments={snapshot.payments} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className={cn(heroShell, "p-8 sm:p-10")}>
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className={portalChrome.eyebrow}>{t.eyebrow}</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{t.title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600">{t.subtitle}</p>
            <p className="mt-5 text-sm font-medium text-teal-700">{t.paymentLabel}</p>
            <p className="mt-1 text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
              {formatCurrency(snapshot.amount_usd, locale)}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs text-zinc-600 ring-1 ring-zinc-200/80">
              <Shield className="h-3.5 w-3.5 text-teal-600" />
              {t.heroNote}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[min(100%,420px)]">
            <HeroMetric
              label={locale === "zh" ? "AI 派单" : "AI dispatch"}
              icon={Sparkles}
            />
            <HeroMetric
              label={locale === "zh" ? "优先接单" : "Priority access"}
              icon={Zap}
            />
            <HeroMetric
              label={locale === "zh" ? "30 天可退" : "30-day refund"}
              icon={Shield}
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0">
          {submitted || snapshot.pending_payment ? (
            <PendingPaymentCard locale={locale} snapshot={snapshot} submitted={submitted} />
          ) : (
            <section className={panelShell}>
              <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
                <h2 className="text-base font-semibold tracking-tight text-zinc-950">{t.paySection}</h2>
                <p className="mt-0.5 text-sm text-zinc-500">{t.secureTransfer}</p>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <div className="space-y-3">
                  <Label className="text-zinc-700">{t.method}</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DEPOSIT_PAYMENT_METHODS.map((type) => {
                      const Icon = methodIcons[type];
                      const active = method === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMethod(type)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition",
                            active
                              ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                              : "border-zinc-200/90 bg-zinc-50/50 text-zinc-700 hover:border-zinc-300 hover:bg-white"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              active ? "bg-white/15 text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200/80"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          {paymentMethodLabel(type, locale)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/60 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-zinc-500" />
                        <p className="text-sm font-semibold text-zinc-950">{t.corporateAccount}</p>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-zinc-500">{t.corporateNote}</p>
                      <p className="mt-3 text-sm font-medium text-zinc-900">{account.account_holder}</p>
                    </div>
                    <div className="hidden shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-right sm:block">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                        {t.paymentLabel}
                      </p>
                      <p className="text-lg font-semibold text-white">{formatCurrency(snapshot.amount_usd, locale)}</p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-2">
                    {account.details.map((row) => (
                      <div
                        key={row.key}
                        className="flex flex-col gap-2 rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <dt className="text-xs font-medium text-zinc-500">{row.key}</dt>
                        <dd className="flex min-w-0 items-center gap-2">
                          <span className="break-all font-mono text-sm text-zinc-900">{row.value}</span>
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
                  {account.note ? <p className="mt-3 text-xs leading-5 text-zinc-500">{account.note}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_reference">{t.reference}</Label>
                  <Input
                    id="payment_reference"
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder={locale === "zh" ? "转账单号 / 哈希" : "Transfer ID / hash"}
                    className="h-11 rounded-lg border-zinc-200"
                  />
                  <p className="text-xs leading-5 text-zinc-500">{t.referenceHint}</p>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full rounded-lg text-sm font-medium shadow-sm"
                  disabled={isPending}
                  onClick={handleSubmit}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                  {t.submit}
                </Button>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <RefundPolicy locale={locale} />
          <ProgramBenefits locale={locale} />
        </aside>
      </div>

      {snapshot.payments.length > 0 ? (
        <DepositHistory locale={locale} payments={snapshot.payments} />
      ) : null}
    </div>
  );
}

function HeroMetric({ label, icon: Icon }: { label: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/70 px-4 py-3.5 backdrop-blur-sm">
      <Icon className="h-4 w-4 text-zinc-500" />
      <p className="mt-2 text-sm font-medium leading-snug text-zinc-800">{label}</p>
    </div>
  );
}

function PendingPaymentCard({
  locale,
  snapshot,
  submitted
}: {
  locale: Locale;
  snapshot: CreatorDepositSnapshot;
  submitted?: boolean;
}) {
  const t = tCertified(locale);
  const router = useRouter();
  const [elapsedSec, setElapsedSec] = useState(0);
  const [pollError, setPollError] = useState<string | null>(null);

  const hasPending =
    submitted ||
    Boolean(snapshot.pending_payment) ||
    snapshot.payments.some((payment) => payment.status === "pending" || payment.status === "under_review");

  useEffect(() => {
    if (!hasPending || snapshot.can_accept_orders) {
      return;
    }

    setElapsedSec(0);
    let cancelled = false;
    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      if (!cancelled) {
        setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
      }
    }, 1000);

    const poll = window.setInterval(() => {
      void (async () => {
        try {
          const result = await pollDepositStatusAction();
          if (cancelled) return;
          if (!result.ok) {
            return;
          }
          setPollError(null);
          if (result.can_accept_orders) {
            router.replace(withLocale("/studio", locale));
            router.refresh();
          }
        } catch {
          if (cancelled) return;
          setPollError(locale === "zh" ? "状态刷新失败，请稍后重试。" : "Could not refresh status. Retrying…");
        }
      })();
    }, 2000);

    void pollDepositStatusAction().then((result) => {
      if (cancelled) return;
      if (result.ok && result.can_accept_orders) {
        router.replace(withLocale("/studio", locale));
        router.refresh();
      }
    });

    return () => {
      cancelled = true;
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [hasPending, locale, router, snapshot.can_accept_orders]);

  const pendingStatus = snapshot.pending_payment?.status;
  const statusHint =
    pendingStatus === "under_review" || elapsedSec >= 3
      ? locale === "zh"
        ? "平台正在确认到账，请稍候…"
        : "Confirming your transfer…"
      : locale === "zh"
        ? "已收到付款信息，即将进入审核…"
        : "Payment received — entering review…";

  return (
    <section
      className={cn(
        panelShell,
        "border-amber-200/80 bg-[linear-gradient(180deg,#fffbeb_0%,#ffffff_100%)]"
      )}
    >
      <div className="flex items-start gap-4 p-6 sm:p-8">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <Clock3 className="h-5 w-5 animate-pulse" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold tracking-tight text-zinc-950">{t.pending}</p>
          <p className="mt-2 text-sm leading-7 text-zinc-600">{t.pendingBody}</p>
          <p className="mt-2 text-sm font-medium text-amber-800">{statusHint}</p>
          {snapshot.pending_payment ? (
            <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium text-zinc-800 ring-1 ring-amber-200/80">
              {paymentMethodLabel(snapshot.pending_payment.payment_method, locale)} ·{" "}
              {formatCurrency(snapshot.pending_payment.amount_usd, locale)} {t.paymentLabel}
            </p>
          ) : submitted ? (
            <p className="mt-3 text-sm text-zinc-500">
              {locale === "zh" ? "我们已收到您的提交，请稍候。" : "We received your submission — please wait."}
            </p>
          ) : null}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${Math.min(100, (elapsedSec / 15) * 100)}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-xs tabular-nums text-amber-700">
              {Math.min(elapsedSec, 15)}s
            </span>
          </div>
          {pollError ? <p className="mt-2 text-xs text-red-600">{pollError}</p> : null}
        </div>
      </div>
    </section>
  );
}

function ProgramBenefits({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const t = tCertified(locale);

  return (
    <section className={panelShell}>
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold tracking-tight text-zinc-950">{t.benefitsSection}</h2>
      </div>
      <ul className={cn("divide-y divide-zinc-100", compact ? "px-4 py-2" : "px-5 py-2 sm:px-6")}>
        {t.benefits.map((benefit, index) => {
          const Icon = benefitIcons[index] ?? CheckCircle2;
          const [title, detail] = benefit.split(" — ");
          return (
            <li key={benefit} className="flex gap-3 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium leading-snug text-zinc-950">{title}</p>
                {detail ? <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RefundPolicy({ locale }: { locale: Locale }) {
  const t = tCertified(locale);
  const badge = locale === "zh" ? "零风险保障" : "Risk-free guarantee";

  return (
    <section className={cn(panelShell, "border-zinc-900/10")}>
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Shield className="h-4 w-4" />
          </span>
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">{t.refundSection}</h2>
          <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {badge}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-5 sm:p-6">
        <p className="text-[15px] font-medium leading-7 text-zinc-950">
          {locale === "zh" ? (
            <>
              连续 <span className="font-semibold text-teal-700">30 天</span>
              未获得任何有效订单，可申请
              <span className="font-semibold text-teal-700">全额退款</span>。
            </>
          ) : (
            <>
              If you receive no valid orders for{" "}
              <span className="font-semibold text-teal-700">30 consecutive days</span>, you may apply for a{" "}
              <span className="font-semibold text-teal-700">full refund</span>.
            </>
          )}
        </p>
        <p className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-3.5 py-3 text-xs leading-5 text-zinc-600">
          {t.refundNote}
        </p>
      </div>
    </section>
  );
}

function DepositHistory({
  locale,
  payments
}: {
  locale: Locale;
  payments: CreatorDepositSnapshot["payments"];
}) {
  const t = tCertified(locale);
  const extra = copyExtra[locale];

  return (
    <section className={panelShell}>
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold tracking-tight text-zinc-950">{t.history}</h2>
      </div>
      {payments.length === 0 ? (
        <p className="px-5 py-6 text-sm text-zinc-500 sm:px-6">{t.historyEmpty}</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div>
                <p className="text-sm font-medium text-zinc-950">
                  {paymentMethodLabel(payment.payment_method, locale)} · {formatCurrency(payment.amount_usd, locale)}{" "}
                  {t.paymentLabel}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(payment.created_at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                  {payment.payment_reference ? ` · ${payment.payment_reference}` : ""}
                </p>
              </div>
              <span className="inline-flex w-fit rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                {extra.status[payment.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
