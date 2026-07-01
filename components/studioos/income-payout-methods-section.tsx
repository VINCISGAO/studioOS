"use client";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { maskWalletAddress, payoutMethodSummary } from "@/lib/studioos/withdrawal-utils";
import type { PayoutMethod, PayoutMethodType } from "@/lib/studioos/withdrawal-types";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Bitcoin,
  ChevronRight,
  Landmark,
  MessageCircle,
  Smartphone
} from "lucide-react";

const copy = {
  zh: {
    payoutMethods: "收款方式",
    payoutMethodsBody: "提现前需添加银行账户、PayPal、支付宝、微信或加密货币钱包。",
    addMethod: "添加收款方式",
    default: "默认",
    verified: "已验证",
    unverified: "未验证",
    emptyTitle: "连接收款方式",
    emptyBody: "添加银行、PayPal、支付宝、微信或加密货币钱包以接收收入。"
  },
  en: {
    payoutMethods: "Payout methods",
    payoutMethodsBody: "Add a bank account, PayPal, Alipay, WeChat Pay, or crypto wallet before withdrawing.",
    addMethod: "Add payout method",
    default: "Default",
    verified: "Verified",
    unverified: "Unverified",
    emptyTitle: "Connect a payout method",
    emptyBody: "Add bank, PayPal, Alipay, WeChat Pay, or crypto to receive earnings."
  }
} as const;

function methodTitle(type: PayoutMethodType, locale: Locale) {
  if (type === "bank_wire") return locale === "zh" ? "银行账户" : "Bank account";
  if (type === "paypal") return "PayPal";
  if (type === "alipay") return locale === "zh" ? "支付宝" : "Alipay";
  if (type === "wechat") return locale === "zh" ? "微信支付" : "WeChat Pay";
  return locale === "zh" ? "加密货币钱包" : "Crypto wallet";
}

function MethodIcon({ type, className }: { type: PayoutMethodType; className?: string }) {
  if (type === "crypto") return <Bitcoin className={className} />;
  if (type === "paypal") return <Banknote className={className} />;
  if (type === "alipay") return <Smartphone className={className} />;
  if (type === "wechat") return <MessageCircle className={className} />;
  return <Landmark className={className} />;
}

function methodSubtitle(method: PayoutMethod, locale: Locale) {
  if (method.type === "bank_wire") {
    return locale === "zh"
      ? `**** ${method.account_last4 ?? "4242"} - ${method.bank_name ?? "Santander Bank"}`
      : `**** ${method.account_last4 ?? "4242"} - ${method.bank_name ?? "Santander Bank"}`;
  }
  if (method.type === "crypto" && method.wallet_address) {
    return maskWalletAddress(method.wallet_address);
  }
  return payoutMethodSummary(method, locale);
}

function MethodBadge({ type }: { type: PayoutMethodType }) {
  const tone =
    type === "crypto"
      ? "bg-violet-50 text-violet-600 ring-violet-100"
      : type === "paypal"
        ? "bg-blue-50 text-blue-600 ring-blue-100"
        : type === "alipay"
          ? "bg-sky-50 text-sky-600 ring-sky-100"
          : type === "wechat"
            ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
            : "bg-zinc-100 text-zinc-600 ring-zinc-200";

  return (
    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1", tone)}>
      <MethodIcon type={type} className="h-5 w-5" />
    </span>
  );
}

export function IncomePayoutMethodsSection({
  locale,
  methods,
  successMessage,
  onAddMethod,
  onEditMethod
}: {
  locale: Locale;
  methods: PayoutMethod[];
  successMessage: string | null;
  onAddMethod: () => void;
  onEditMethod: (method: PayoutMethod) => void;
}) {
  const t = copy[locale];

  return (
    <section className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">{t.payoutMethods}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t.payoutMethodsBody}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 rounded-lg border-zinc-200"
          onClick={onAddMethod}
        >
          <Landmark className="h-3.5 w-3.5" />
          {t.addMethod}
        </Button>
      </div>

      {successMessage ? (
        <div className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 sm:mx-6">
          {successMessage}
        </div>
      ) : null}

      {methods.length ? (
        <ul className="divide-y divide-zinc-100">
          {methods.map((method) => {
            const verified = method.verified ?? (method.type === "bank_wire" || method.type === "paypal");
            return (
              <li key={method.id}>
                <button
                  type="button"
                  onClick={() => onEditMethod(method)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-zinc-50/80 sm:px-6"
                >
                  <MethodBadge type={method.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-950">{methodTitle(method.type, locale)}</p>
                      {method.is_default ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          {t.default}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-zinc-500">{methodSubtitle(method, locale)}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 text-xs",
                      verified ? "text-emerald-600" : "text-zinc-400"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", verified ? "bg-emerald-500" : "bg-zinc-300")} />
                    {verified ? t.verified : t.unverified}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="px-6 py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
            <Landmark className="h-5 w-5" />
          </span>
          <p className="mt-4 text-base font-medium text-zinc-950">{t.emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{t.emptyBody}</p>
          <Button className="mt-6 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={onAddMethod}>
            <Landmark className="h-4 w-4" /> {t.addMethod}
          </Button>
        </div>
      )}
    </section>
  );
}
