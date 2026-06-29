"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bitcoin,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  MessageCircle,
  Shield,
  Smartphone,
  Wallet
} from "lucide-react";
import { payOrderAction } from "@/app/order-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const BRAND_PAYMENT_METHODS: PayoutMethodType[] = ["alipay", "wechat", "paypal", "crypto"];

const copy = {
  en: {
    title: "Escrow checkout",
    subtitle: "Funds are held until you approve the final delivery. Production starts after payment.",
    amount: "Order total",
    fee: "Platform fee",
    payout: "Studio payout",
    method: "Payment method",
    reference: "Transfer reference (optional)",
    referenceHint: "Add your bank or wallet reference so we can match your payment faster.",
    payDemo: "Confirm payment & start production",
    payCard: "Pay with card (Stripe)",
    paidTitle: "Payment in escrow",
    paidBody: "Your campaign is funded. The studio can begin production.",
    copy: "Copy",
    copied: "Copied",
    secure: "256-bit encrypted · Escrow protected"
  },
  zh: {
    title: "托管付款",
    subtitle: "款项托管至你确认交付后释放。付款完成后 Studio 开始制作。",
    amount: "订单总额",
    fee: "平台服务费",
    payout: "Studio 收入",
    method: "付款方式",
    reference: "转账备注（选填）",
    referenceHint: "填写银行或钱包备注，便于我们更快对账。",
    payDemo: "确认付款并开始制作",
    payCard: "信用卡付款（Stripe）",
    paidTitle: "托管中",
    paidBody: "Campaign 已付款，Studio 可以开始制作。",
    copy: "复制",
    copied: "已复制",
    secure: "256 位加密 · 托管保障"
  }
};

const methodIcons: Record<PayoutMethodType, typeof Landmark> = {
  bank_wire: Landmark,
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
  paid
}: {
  locale: Locale;
  order: StoredOrder;
  projectId: string;
  studioName: string;
  paid?: boolean;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [method, setMethod] = useState<PayoutMethodType>("alipay");
  const [reference, setReference] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const account = useMemo(
    () => getPlatformCorporateAccount(method, order.id, locale),
    [method, order.id, locale]
  );

  function copyValue(key: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  }

  function handlePay() {
    const formData = new FormData();
    formData.set("lang", locale);
    formData.set("order_id", order.id);
    formData.set("project_id", projectId);
    formData.set("payment_method", method);
    if (reference.trim()) {
      formData.set("payment_reference", reference.trim());
    }
    startTransition(async () => {
      await payOrderAction(formData);
      router.refresh();
    });
  }

  if (order.payment_status !== "unpaid" || paid) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/80 shadow-none">
        <CardContent className="flex items-start gap-4 p-6">
          <BadgeCheck className="mt-0.5 h-8 w-8 shrink-0 text-emerald-700" />
          <div>
            <h2 className="text-xl font-semibold text-emerald-950">{t.paidTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900/90">{t.paidBody}</p>
            <p className="mt-3 text-sm font-medium text-emerald-950">
              {formatCurrency(order.amount)} · {studioName}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="border-zinc-200/80 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{t.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{t.subtitle}</p>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 sm:flex">
              <Shield className="h-3.5 w-3.5" />
              {t.secure}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-sm">
              {t.amount}: {formatCurrency(order.amount)}
            </Badge>
            <Badge variant="outline">{t.fee}: {formatCurrency(order.platform_fee)}</Badge>
            <Badge variant="outline">{t.payout}: {formatCurrency(order.creator_payout)}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200/80 shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-zinc-900">{t.method}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {BRAND_PAYMENT_METHODS.map((item) => {
              const Icon = methodIcons[item];
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMethod(item)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                    method === item
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {paymentMethodLabel(item, locale)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMethod("bank_wire")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                method === "bank_wire"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              )}
            >
              <CreditCard className="h-4 w-4" />
              {locale === "zh" ? "银行卡" : "Card / wire"}
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
            <p className="text-sm font-semibold text-zinc-900">{account.label}</p>
            <p className="mt-1 text-xs text-zinc-500">{account.account_holder}</p>
            <dl className="mt-4 space-y-2">
              {account.details.map((row) => (
                <div key={row.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <dt className="text-zinc-500">{row.key}</dt>
                  <dd className="flex items-center gap-2 font-medium text-zinc-900">
                    <span>{row.value}</span>
                    <button
                      type="button"
                      className="text-xs text-zinc-500 underline-offset-2 hover:underline"
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
              placeholder={locale === "zh" ? "例如：Campaign 转账单号" : "e.g. bank transfer ID"}
            />
            <p className="text-xs text-zinc-500">{t.referenceHint}</p>
          </div>

          <Button
            type="button"
            size="lg"
            className="mt-6 h-12 w-full rounded-full text-base sm:w-auto sm:px-10"
            disabled={isPending}
            onClick={handlePay}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {method === "bank_wire" ? t.payCard : t.payDemo}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
