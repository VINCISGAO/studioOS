"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { pollDepositStatusAction } from "@/app/deposit-actions";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { tCertified } from "@/lib/studioos/deposit-copy";
import type { CreatorDepositSnapshot } from "@/lib/studioos/deposit-types";
import { paymentMethodLabel } from "@/lib/studioos/deposit-utils";
import { cn, formatCurrency } from "@/lib/utils";

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
                style={{ width: `${Math.min(100, (elapsedSec / 8) * 100)}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-xs tabular-nums text-amber-700">
              {Math.min(elapsedSec, 8)}s
            </span>
          </div>
          {pollError ? <p className="mt-2 text-xs text-red-600">{pollError}</p> : null}
        </div>
      </div>
    </section>
  );
}
