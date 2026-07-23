"use client";

import { useMemo, useState, useTransition } from "react";
import { ExternalLink, Landmark, LoaderCircle, ShieldCheck } from "lucide-react";
import type { StripeConnectStatusView } from "@/features/payment/stripe-connect.types";
import type { Locale } from "@/lib/i18n";
import { formatSettlementUsd } from "@/lib/money/display-money";
import { MIN_WITHDRAWAL_USD } from "@/lib/studioos/withdrawal-utils";

export function IncomeStripeConnectSection({
  locale,
  status,
  availableUsd,
  connectNotice
}: {
  locale: Locale;
  status: StripeConnectStatusView;
  availableUsd: number;
  connectNotice?: "return" | "refresh" | null;
}) {
  const zh = locale === "zh";
  const [amount, setAmount] = useState(String(Math.max(MIN_WITHDRAWAL_USD, Math.min(availableUsd, 500)).toFixed(0)));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const amountNumber = Number(amount);
  const canWithdraw =
    status.payoutsEnabled &&
    Number.isFinite(amountNumber) &&
    amountNumber >= MIN_WITHDRAWAL_USD &&
    amountNumber <= availableUsd;

  const notice = useMemo(() => {
    if (connectNotice === "return") {
      return zh ? "Stripe 账户信息已提交，正在同步状态…" : "Stripe account submitted — syncing status…";
    }
    if (connectNotice === "refresh") {
      return zh ? "请继续完成 Stripe 入驻。" : "Continue Stripe onboarding to enable payouts.";
    }
    return null;
  }, [connectNotice, zh]);

  function startOnboarding() {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/v1/creator/connect/onboard", { method: "POST" });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { onboardingUrl?: string };
        error?: { message?: string };
      };
      if (!response.ok || !payload.success || !payload.data?.onboardingUrl) {
        setError(payload.error?.message ?? (zh ? "无法打开 Stripe 入驻" : "Unable to open Stripe onboarding"));
        return;
      }
      window.location.href = payload.data.onboardingUrl;
    });
  }

  function submitWithdrawal() {
    if (!canWithdraw || pending) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const response = await fetch("/api/v1/creator/connect/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: amountNumber })
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { transferId?: string; amountUsd?: number };
        error?: { message?: string };
      };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? (zh ? "提现失败" : "Withdrawal failed"));
        return;
      }
      setSuccess(
        zh
          ? `已发起 Stripe 提现 ${formatSettlementUsd(payload.data?.amountUsd ?? amountNumber, locale)}`
          : `Stripe withdrawal sent for ${formatSettlementUsd(payload.data?.amountUsd ?? amountNumber, locale)}`
      );
    });
  }

  if (!status.configured) {
    return (
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Landmark className="mt-0.5 h-5 w-5 text-zinc-400" />
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              {zh ? "Stripe Connect 提现" : "Stripe Connect payouts"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {zh
                ? "配置 STRIPE_SECRET_KEY 与 STRIPE_WEBHOOK_SECRET 后即可启用自动提现。"
                : "Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to enable automated payouts."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-violet-600" />
            <h2 className="text-base font-semibold text-zinc-950">
              {zh ? "Stripe Connect 提现" : "Stripe Connect payouts"}
            </h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {zh
              ? "绑定 Stripe 后，提现会直接转入你的 Stripe 账户。"
              : "After connecting Stripe, withdrawals transfer directly to your connected account."}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          {status.payoutsEnabled
            ? zh
              ? "已可收款"
              : "Payouts enabled"
            : zh
              ? "待完成入驻"
              : "Onboarding required"}
        </div>
      </div>

      {notice ? (
        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-800">{notice}</div>
      ) : null}
      {error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
      ) : null}
      {success ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      {!status.payoutsEnabled ? (
        <button
          type="button"
          disabled={pending}
          onClick={startOnboarding}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          {zh ? "连接 Stripe 账户" : "Connect Stripe account"}
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-zinc-500" htmlFor="stripe-connect-amount">
            {zh ? "提现金额（美元）" : "Withdrawal amount (USD)"}
          </label>
          <input
            id="stripe-connect-amount"
            type="number"
            min={MIN_WITHDRAWAL_USD}
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
          />
          <p className="text-xs text-zinc-400">
            {zh
              ? `可用 ${formatSettlementUsd(availableUsd, locale)} · 最低 ${formatSettlementUsd(MIN_WITHDRAWAL_USD, locale)}`
              : `Available ${formatSettlementUsd(availableUsd, locale)} · Min ${formatSettlementUsd(MIN_WITHDRAWAL_USD, locale)}`}
          </p>
          <button
            type="button"
            disabled={!canWithdraw || pending}
            onClick={submitWithdrawal}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {zh ? "通过 Stripe 提现" : "Withdraw via Stripe"}
          </button>
        </div>
      )}
    </section>
  );
}
