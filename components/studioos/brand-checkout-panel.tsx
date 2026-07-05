"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  BadgeCheck,
  Bitcoin,
  Check,
  CreditCard,
  Info,
  Landmark,
  Loader2,
  Lock,
  MessageCircle,
  Shield,
  Smartphone,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
import { getPlatformCorporateAccount, paymentMethodLabel } from "@/lib/studioos/deposit-utils";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { cn, formatCurrency } from "@/lib/utils";

const BRAND_PAYMENT_METHODS: PayoutMethodType[] = ["paypal", "bank_wire", "alipay", "wechat", "crypto"];

const copy = {
  en: {
    amountDue: "Amount due",
    amount: "Order total",
    fee: "Platform fee",
    payout: "Studio payout",
    method: "Payment method",
    accountTitle: "Receiving account",
    reference: "Transfer reference (optional)",
    referencePlaceholder: "e.g. Campaign transfer ID",
    payDemo: "Confirm payment & start matching",
    payCard: "Pay with card (Stripe)",
    paidTitle: "Payment in escrow",
    paidBody: "Your campaign is funded. Creator matching can begin.",
    copy: "Copy",
    copied: "Copied"
  },
  zh: {
    amountDue: "付款总额",
    amount: "订单总额",
    fee: "平台服务费",
    payout: "Studio 收入",
    method: "支付方式",
    accountTitle: "收款账户信息",
    reference: "转账备注（选填）",
    referencePlaceholder: "例如：Campaign 转账单号",
    payDemo: "确认付款并开始匹配",
    payCard: "信用卡付款（Stripe）",
    paidTitle: "托管中",
    paidBody: "Campaign 已付款，可以开始匹配 Studio。",
    copy: "复制",
    copied: "已复制"
  }
} as const;

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
      className="h-12 w-full rounded-[10px] bg-indigo-600 text-sm font-semibold shadow-[0_14px_26px_rgba(79,70,229,0.25)] hover:bg-indigo-700"
      disabled={pending}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
      {label}
    </Button>
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

  function copyValue(key: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  }

  if (order.payment_status !== "unpaid" || paid || escrowFunded) {
    return (
      <div className="rounded-[14px] border border-emerald-200 bg-emerald-50/80 p-6">
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
    <form action={`/brand/projects/${projectId}/checkout/pay`} method="post" className="mt-0 self-start space-y-4">
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="order_id" value={order.id} />
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="payment_method" value={method} />
      <input type="hidden" name="payment_reference" value={reference} />

      <div className="rounded-[14px] border border-zinc-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Landmark className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">{t.amountDue}</p>
        </div>
        <p className="text-4xl font-semibold tracking-tight text-indigo-600">{formatCurrency(order.amount)}</p>
        <div className="mt-5 space-y-3 border-t border-zinc-100 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">{t.amount}</span>
            <span className="font-semibold text-zinc-950">{formatCurrency(order.amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-zinc-500">
              {t.fee}
              <Info className="h-3.5 w-3.5 text-zinc-400" />
            </span>
            <span className="font-semibold text-zinc-950">{formatCurrency(order.platform_fee)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-zinc-500">
              {t.payout}
              <Info className="h-3.5 w-3.5 text-zinc-400" />
            </span>
            <span className="font-semibold text-zinc-950">{formatCurrency(order.creator_payout)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-[14px] border border-zinc-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <CreditCard className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">{t.method}</p>
        </div>
        <div className="space-y-2">
          {BRAND_PAYMENT_METHODS.map((item) => {
            const Icon = methodIcons[item];
            const active = method === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setMethod(item)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-[10px] border px-3 text-sm font-medium transition",
                  active
                    ? "border-indigo-500 bg-indigo-50/60 text-zinc-950 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.16)]"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-white",
                      item === "alipay" && "bg-blue-500",
                      item === "wechat" && "bg-green-500",
                      item === "paypal" && "bg-blue-700",
                      item === "crypto" && "bg-amber-500",
                      item === "bank_wire" && "bg-zinc-500"
                    )}
                  >
                    {item === "alipay" ? "支" : item === "wechat" ? "微" : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  {item === "bank_wire" ? (locale === "zh" ? "银行卡" : "Bank card") : paymentMethodLabel(item, locale)}
                </span>
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    active ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-200 bg-white"
                  )}
                >
                  {active ? <Check className="h-3 w-3" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[14px] border border-zinc-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Shield className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-zinc-900">{t.accountTitle}</p>
        </div>
        <dl className="space-y-3">
          {account.details.map((row) => (
            <div key={row.key} className="text-sm">
              <dt className="text-xs text-zinc-500">{row.key}</dt>
              <dd className="mt-1 flex items-center justify-between gap-3">
                <span className="break-all text-xs font-medium text-zinc-900">{row.value}</span>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  onClick={() => copyValue(row.key, row.value)}
                >
                  {copiedKey === row.key ? t.copied : t.copy}
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-[14px] border border-zinc-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <label htmlFor="payment-reference" className="text-sm font-semibold text-zinc-900">
          {t.reference}
        </label>
        <Input
          id="payment-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder={t.referencePlaceholder}
          className="mt-3 h-11 rounded-[10px] border-zinc-200 bg-zinc-50/70"
        />
      </div>

      <PaySubmitButton label={method === "bank_wire" ? t.payCard : t.payDemo} />
    </form>
  );
}
