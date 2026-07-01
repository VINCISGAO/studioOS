"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  BadgeCheck,
  Bitcoin,
  Check,
  CheckCircle2,
  CreditCard,
  Info,
  Landmark,
  Loader2,
  MessageCircle,
  Shield,
  Smartphone,
  Wallet
} from "lucide-react";
import { payBrandCampaignCheckoutAction } from "@/app/brand-payment-actions";
import { BrandPaymentDeadlineNotice } from "@/components/studioos/brand-payment-deadline-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
import {
  getPlatformCorporateAccount,
  paymentMethodLabel
} from "@/lib/studioos/deposit-utils";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { cn, formatCurrency } from "@/lib/utils";

const BRAND_PAYMENT_METHODS: PayoutMethodType[] = ["alipay", "wechat", "paypal", "crypto", "bank_wire"];

const copy = {
  en: {
    amountDue: "Amount due",
    secureBadge: "256-bit encrypted · Escrow protected · Funds released per policy",
    title: "Escrow payment",
    subtitle: "Matching starts after payment. Funds release after you approve delivery.",
    amount: "Order total",
    fee: "Platform fee",
    payout: "Studio payout",
    method: "Payment method",
    reference: "Transfer reference (optional)",
    referenceHint: "Add your bank or wallet reference so we can match your payment faster.",
    referencePlaceholder: "e.g. Campaign transfer ID",
    payDemo: "Confirm payment & start matching",
    payCard: "Pay with card (Stripe)",
    paidTitle: "Payment in escrow",
    paidBody: "Your campaign is funded. Creator matching can begin.",
    copy: "Copy",
    copied: "Copied",
    corporateAccount: "StudioOS corporate account"
  },
  zh: {
    amountDue: "应付金额",
    secureBadge: "256 位加密 · 托管保障 / 资金安全，按规则释放",
    title: "托管付款",
    subtitle: "款项托管至你确认交付后释放。付款完成后才开始匹配 Studio。",
    amount: "订单总额",
    fee: "平台服务费",
    payout: "Studio 收入",
    method: "付款方式",
    reference: "转账备注（选填）",
    referenceHint: "填写银行或钱包备注，便于我们更快对账。",
    referencePlaceholder: "例如：Campaign 转账单号",
    payDemo: "确认付款并开始匹配",
    payCard: "信用卡付款（Stripe）",
    paidTitle: "托管中",
    paidBody: "Campaign 已付款，可以开始匹配 Studio。",
    copy: "复制",
    copied: "已复制",
    corporateAccount: "StudioOS 对公账户"
  }
};

const methodIcons: Record<PayoutMethodType, typeof Landmark> = {
  bank_wire: CreditCard,
  paypal: Wallet,
  alipay: Smartphone,
  wechat: MessageCircle,
  crypto: Bitcoin
};

function PaySubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="mt-6 h-12 w-full rounded-xl bg-indigo-600 text-base font-medium hover:bg-indigo-700"
      disabled={pending}
    >
      {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
      {label}
    </Button>
  );
}

function BreakdownBox({
  label,
  value,
  showInfo
}: {
  label: string;
  value: string;
  showInfo?: boolean;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-100">
      <p className="flex items-center gap-1 text-xs text-zinc-500">
        {label}
        {showInfo ? <Info className="h-3.5 w-3.5 text-zinc-400" /> : null}
      </p>
      <p className="mt-1 text-lg font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

export function BrandCheckoutPanel({
  locale,
  order,
  projectId,
  studioName,
  paid,
  escrowFunded
}: {
  locale: Locale;
  order: StoredOrder;
  projectId: string;
  studioName: string;
  paid?: boolean;
  escrowFunded?: boolean;
}) {
  const t = copy[locale];
  const [method, setMethod] = useState<PayoutMethodType>("alipay");
  const [reference, setReference] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const account = useMemo(
    () => getPlatformCorporateAccount(method, order.id, locale),
    [method, order.id, locale]
  );

  const accountTitle =
    locale === "zh" && (method === "alipay" || method === "wechat")
      ? `${paymentMethodLabel(method, locale)} ${t.corporateAccount}`
      : account.label;

  function copyValue(key: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  }

  if (order.payment_status !== "unpaid" || paid || escrowFunded) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6">
        <div className="flex items-start gap-4">
          <BadgeCheck className="mt-0.5 h-8 w-8 shrink-0 text-emerald-700" />
          <div>
            <h2 className="text-xl font-semibold text-emerald-950">{t.paidTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900/90">{t.paidBody}</p>
            <p className="mt-3 text-sm font-medium text-emerald-950">
              {formatCurrency(order.amount)} · {studioName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BrandPaymentDeadlineNotice locale={locale} order={order} />
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">{t.amountDue}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-indigo-600">
              {formatCurrency(order.amount)}
            </p>
          </div>
          <div className="hidden max-w-[220px] rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-indigo-700 sm:block">
            <div className="mb-1 flex items-center gap-1.5 font-medium">
              <Shield className="h-3.5 w-3.5" />
              {locale === "zh" ? "托管保障" : "Escrow"}
            </div>
            {t.secureBadge}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-zinc-950">{t.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.subtitle}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <BreakdownBox label={t.amount} value={formatCurrency(order.amount)} />
              <BreakdownBox label={t.fee} value={formatCurrency(order.platform_fee)} showInfo />
              <BreakdownBox label={t.payout} value={formatCurrency(order.creator_payout)} showInfo />
            </div>
          </div>
          <div className="relative hidden h-24 w-24 shrink-0 lg:block" aria-hidden>
            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-sky-100 to-indigo-100" />
            <div className="absolute left-3 top-5 h-14 w-16 rounded-xl bg-white shadow-md ring-1 ring-indigo-100" />
            <div className="absolute left-6 top-8 h-8 w-10 rounded-md bg-indigo-500/90" />
            <div className="absolute bottom-4 right-4 h-3 w-3 rounded-full bg-indigo-400" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <form action={payBrandCampaignCheckoutAction}>
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="order_id" value={order.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="payment_method" value={method} />
          <input type="hidden" name="payment_reference" value={reference} />

          <p className="text-sm font-semibold text-zinc-950">{t.method}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BRAND_PAYMENT_METHODS.map((item) => {
              const Icon = methodIcons[item];
              const active = method === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMethod(item)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                    active
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.12)]"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  {active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  {item === "bank_wire" ? (locale === "zh" ? "银行卡" : "Bank card") : paymentMethodLabel(item, locale)}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
            <p className="text-sm font-semibold text-zinc-900">{accountTitle}</p>
            <dl className="mt-4 space-y-3">
              {account.details.map((row) => (
                <div key={row.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <dt className="text-zinc-500">{row.key}</dt>
                  <dd className="flex items-center gap-2 font-medium text-zinc-900">
                    <span className="break-all">{row.value}</span>
                    <button
                      type="button"
                      className="shrink-0 text-xs text-indigo-600 hover:text-indigo-700"
                      onClick={() => copyValue(row.key, row.value)}
                    >
                      {copiedKey === row.key ? t.copied : t.copy}
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
            {account.note ? <p className="mt-3 text-xs leading-5 text-zinc-500">{account.note}</p> : null}
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="payment-reference">{t.reference}</Label>
            <Input
              id="payment-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder={t.referencePlaceholder}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-zinc-500">{t.referenceHint}</p>
          </div>

          <PaySubmitButton label={method === "bank_wire" ? t.payCard : t.payDemo} />
        </form>
      </div>
    </div>
  );
}
