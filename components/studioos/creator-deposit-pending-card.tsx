"use client";

import { Clock3 } from "lucide-react";
import { useDepositStatusPolling } from "@/hooks/use-deposit-status-polling";
import type { Locale } from "@/lib/i18n";
import { tCertified } from "@/lib/studioos/deposit-copy";
import type { CreatorDepositSnapshot } from "@/lib/studioos/deposit-types";
import { paymentMethodLabel } from "@/lib/studioos/deposit-utils";
import { formatSettlementUsd } from "@/lib/money/display-money";
import { cn } from "@/lib/utils";

const panelShell =
  "overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]";

export function CreatorDepositPendingCard({
  locale,
  snapshot,
  submitted
}: {
  locale: Locale;
  snapshot: CreatorDepositSnapshot;
  submitted?: boolean;
}) {
  const t = tCertified(locale);

  const hasPending =
    submitted ||
    Boolean(snapshot.pending_payment) ||
    snapshot.payments.some((payment) => payment.status === "pending" || payment.status === "under_review");

  const { elapsedSec, pollError, phase } = useDepositStatusPolling({
    locale,
    enabled: hasPending && !snapshot.can_accept_orders
  });

  const pendingStatus = snapshot.pending_payment?.status;
  const statusHint =
    phase === "failed"
      ? locale === "zh"
        ? "自动确认已超时，请刷新页面或联系客服。"
        : "Auto-confirmation timed out. Refresh or contact support."
      : pendingStatus === "under_review" || elapsedSec >= 3
        ? locale === "zh"
          ? "平台正在确认到账，请稍候…"
          : "Confirming your transfer…"
        : locale === "zh"
          ? "已收到付款信息，即将进入审核…"
          : "Payment received — entering review…";

  const progressCap = phase === "failed" ? 100 : 92;

  return (
    <section
      className={cn(
        panelShell,
        phase === "failed"
          ? "border-red-200/80 bg-[linear-gradient(180deg,#fef2f2_0%,#ffffff_100%)]"
          : "border-amber-200/80 bg-[linear-gradient(180deg,#fffbeb_0%,#ffffff_100%)]"
      )}
    >
      <div className="flex items-start gap-4 p-6 sm:p-8">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            phase === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
          )}
        >
          <Clock3 className={cn("h-5 w-5", phase !== "failed" && "animate-pulse")} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold tracking-tight text-zinc-950">{t.pending}</p>
          <p className="mt-2 text-sm leading-7 text-zinc-600">{t.pendingBody}</p>
          <p
            className={cn(
              "mt-2 text-sm font-medium",
              phase === "failed" ? "text-red-800" : "text-amber-800"
            )}
          >
            {statusHint}
          </p>
          {snapshot.pending_payment ? (
            <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium text-zinc-800 ring-1 ring-amber-200/80">
              {paymentMethodLabel(snapshot.pending_payment.payment_method, locale)} ·{" "}
              {formatSettlementUsd(snapshot.pending_payment.amount_usd, locale)} {t.paymentLabel}
            </p>
          ) : submitted ? (
            <p className="mt-3 text-sm text-zinc-500">
              {locale === "zh" ? "我们已收到您的提交，请稍候。" : "We received your submission — please wait."}
            </p>
          ) : null}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-amber-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  phase === "failed" ? "bg-red-500" : "bg-amber-500"
                )}
                style={{ width: `${Math.min(progressCap, (elapsedSec / 8) * 100)}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-xs tabular-nums text-amber-700">
              {elapsedSec}s
            </span>
          </div>
          {pollError ? <p className="mt-2 text-xs text-red-600">{pollError}</p> : null}
        </div>
      </div>
    </section>
  );
}
