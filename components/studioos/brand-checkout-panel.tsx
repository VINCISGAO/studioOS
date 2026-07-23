"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Bitcoin,
  Check,
  CreditCard,
  Info,
  Landmark,
  MessageCircle,
  Shield,
  Smartphone,
  Wallet
} from "lucide-react";
import { BrandCheckoutPayButton, BrandCheckoutPayReference } from "@/components/studioos/brand-checkout-pay-action";
import { PortalFixedFooter } from "@/components/studioos/portal/portal-fixed-footer";
import type { Locale } from "@/lib/i18n";
import type { StoredOrder } from "@/lib/order-types";
import { BudgetSettlementCallout, SettlementUsdCallout } from "@/components/studioos/budget-settlement-callout";
import { budgetEscrowVarianceNote } from "@/lib/money/display-money";
import { getPlatformCorporateAccount, paymentMethodLabel } from "@/lib/studioos/deposit-utils";
import type { PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { useBrandCheckoutSubmit } from "@/hooks/use-brand-checkout-submit";
import { cn, formatCurrency } from "@/lib/utils";

const BRAND_PAYMENT_METHODS: PayoutMethodType[] = ["paypal", "bank_wire", "alipay", "wechat", "crypto"];

const copy = {
  en: {
    amountDue: "Amount due",
    amount: "Order total",
    fee: "Platform fee",
    payout: "Studio payout",
    total: "Total",
    method: "Choose payment method",
    accountTitle: "Receiving account",
    paidTitle: "Payment in escrow",
    paidBody: "Your campaign is funded. Creator matching can begin.",
    copy: "Copy",
    copied: "Copied"
  },
  zh: {
    amountDue: "付款总额",
    amount: "订单总额",
    fee: "平台服务费",
    payout: "创作者收入",
    total: "合计",
    method: "选择支付方式",
    accountTitle: "收款账户信息",
    paidTitle: "托管中",
    paidBody: "广告项目已付款，可以开始匹配创作者。",
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

export function BrandCheckoutPanel({
  locale,
  order,
  projectId,
  studioName,
  escrowFunded,
  deadlineNotice,
  summaryColumn,
  displayBudgetInput,
  paymentSignal
}: {
  locale: Locale;
  order: StoredOrder;
  projectId: string;
  studioName: string;
  escrowFunded?: boolean;
  deadlineNotice?: ReactNode;
  summaryColumn?: ReactNode;
  displayBudgetInput?: string | null;
  /** URL error/cancel query — clears stuck pay-button pending on return. */
  paymentSignal?: string | null;
}) {
  const t = copy[locale];
  const varianceNote = budgetEscrowVarianceNote(order.amount, locale, displayBudgetInput);
  const [method, setMethod] = useState<PayoutMethodType>("alipay");
  const [reference, setReference] = useState("");
  const { pending, onSubmit } = useBrandCheckoutSubmit(paymentSignal);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const formId = `brand-checkout-${projectId}`;

  const account = useMemo(
    () => getPlatformCorporateAccount(method, order.id, locale),
    [method, order.id, locale]
  );

  function copyValue(key: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  }

  if (order.payment_status !== "unpaid" || escrowFunded) {
    return (
      <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 p-6">
        <div className="flex items-start gap-4">
          <BadgeCheck className="mt-0.5 h-8 w-8 shrink-0 text-emerald-700" />
          <div>
            <h2 className="text-xl font-semibold text-emerald-950">{t.paidTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900/90">{t.paidBody}</p>
            <p className="mt-3 text-sm font-medium text-emerald-950">
              {formatCurrency(order.amount, locale)} · {studioName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {deadlineNotice ? <div className="w-full min-w-0">{deadlineNotice}</div> : null}
      <div className="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden pb-24 lg:flex-row lg:items-start">
        <form
          id={formId}
          action={`/brand/projects/${projectId}/checkout/pay`}
          method="post"
          onSubmit={(event) => {
            if (!onSubmit()) {
              event.preventDefault();
            }
          }}
          className="order-1 w-full min-w-0 shrink-0 space-y-4 lg:order-2 lg:w-[360px]"
        >
          <input type="hidden" name="lang" value={locale} />
          <input type="hidden" name="order_id" value={order.id} />
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="payment_method" value={method} />
          <input type="hidden" name="payment_reference" value={reference} />

          <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Landmark className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-zinc-900">{t.amountDue}</p>
              </div>
              <p className="text-4xl font-semibold tracking-tight text-violet-600">
                {formatCurrency(order.amount, locale)}
              </p>
              {varianceNote ? (
                <BudgetSettlementCallout message={varianceNote} className="mt-2" />
              ) : (
                <SettlementUsdCallout locale={locale} className="mt-2" />
              )}
              <div className="mt-5 space-y-3 border-t border-zinc-100 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">{t.amount}</span>
                  <span className="font-semibold text-zinc-950">{formatCurrency(order.amount, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-zinc-500">
                    {t.fee}
                    <Info className="h-3.5 w-3.5 text-zinc-400" />
                  </span>
                  <span className="font-semibold text-zinc-950">{formatCurrency(order.platform_fee, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-zinc-500">
                    {t.payout}
                    <Info className="h-3.5 w-3.5 text-zinc-400" />
                  </span>
                  <span className="font-semibold text-zinc-950">{formatCurrency(order.creator_payout, locale)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                  <span className="font-semibold text-zinc-900">{t.total}</span>
                  <span className="font-semibold text-violet-600">{formatCurrency(order.amount, locale)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
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
                        ? "border-violet-500 bg-violet-50/60 text-zinc-950 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.16)]"
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
                        active ? "border-violet-600 bg-violet-600 text-white" : "border-zinc-200 bg-white"
                      )}
                    >
                      {active ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <BrandCheckoutPayReference
            locale={locale}
            formId={formId}
            reference={reference}
            onReferenceChange={setReference}
          />

          <div className="rounded-[1.5rem] border border-zinc-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
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
        </form>

        <div className="order-2 flex min-w-0 flex-1 flex-col gap-5 lg:order-1">
          {summaryColumn ? <Fragment key="summary-column">{summaryColumn}</Fragment> : null}
        </div>
      </div>

      <PortalFixedFooter
        zIndex="z-40"
        innerClassName="flex min-h-14 items-center justify-between gap-3 px-3 py-2 sm:px-4 lg:px-5"
      >
        <div className="min-w-0">
          <p className="text-xs text-zinc-500">{t.amountDue}</p>
          <p className="text-lg font-semibold text-violet-600">{formatCurrency(order.amount, locale)}</p>
        </div>
        <BrandCheckoutPayButton
          locale={locale}
          formId={formId}
          method={method}
          pending={pending}
          compact
        />
      </PortalFixedFooter>
    </>
  );
}
