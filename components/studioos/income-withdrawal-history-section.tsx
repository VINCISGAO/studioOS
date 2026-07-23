"use client";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { maskWalletAddress } from "@/lib/studioos/withdrawal-utils";
import type { WithdrawalRequest, WithdrawalStatus } from "@/lib/studioos/withdrawal-types";
import { formatSettlementUsd } from "@/lib/money/display-money";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock3, Wallet, XCircle } from "lucide-react";

const copy = {
  zh: {
    history: "提现记录",
    recentActivity: "最近动态",
    viewAll: "查看全部",
    emptyTitle: "暂无提现记录",
    emptyBody: "发起提现后，交易状态会在这里实时更新。",
    cancel: "取消提现",
    status: {
      pending: "待审核",
      under_review: "审核中",
      processing: "打款中",
      completed: "已完成",
      failed: "失败",
      cancelled: "已取消"
    } as Record<WithdrawalStatus, string>
  },
  en: {
    history: "Withdrawal history",
    recentActivity: "Recent activity",
    viewAll: "View all",
    emptyTitle: "No withdrawals yet",
    emptyBody: "When you withdraw, transactions will appear here with live status.",
    cancel: "Cancel withdrawal",
    status: {
      pending: "Pending review",
      under_review: "Under review",
      processing: "Processing",
      completed: "Completed",
      failed: "Failed",
      cancelled: "Cancelled"
    } as Record<WithdrawalStatus, string>
  }
} as const;

function WithdrawalStatusBadge({ status, label }: { status: WithdrawalStatus; label: string }) {
  const tone =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "failed" || status === "cancelled"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-800";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", tone)}>
      {status === "completed" ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : status === "failed" || status === "cancelled" ? (
        <XCircle className="h-3.5 w-3.5" />
      ) : (
        <Clock3 className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  );
}

export function IncomeWithdrawalHistorySection({
  locale,
  withdrawals,
  isPending,
  onCancel
}: {
  locale: Locale;
  withdrawals: WithdrawalRequest[];
  isPending: boolean;
  onCancel: (withdrawalId: string) => void;
}) {
  const t = copy[locale];
  const preview = withdrawals.slice(0, 5);

  return (
    <section className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">{t.history}</h2>
          <p className="mt-1 text-sm text-zinc-500">{t.recentActivity}</p>
        </div>
        <button type="button" className="shrink-0 text-sm font-medium text-violet-600 hover:text-violet-700">
          {t.viewAll}
        </button>
      </div>

      {preview.length ? (
        <ul className="divide-y divide-zinc-100">
          {preview.map((item) => (
            <li key={item.id} className="px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-semibold tabular-nums text-zinc-950">{formatSettlementUsd(item.amount_usd, locale)}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {item.crypto_asset
                      ? `${item.crypto_amount} ${item.crypto_asset} · ${maskWalletAddress(item.wallet_address ?? "")}`
                      : formatSettlementUsd(item.net_usd, locale)}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">
                    {new Date(item.created_at).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <WithdrawalStatusBadge status={item.status} label={t.status[item.status]} />
                  {item.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-lg px-3 text-xs"
                      onClick={() => onCancel(item.id)}
                      disabled={isPending}
                    >
                      {t.cancel}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-6 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <Wallet className="h-6 w-6" />
          </span>
          <p className="mt-5 text-base font-semibold text-zinc-950">{t.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">{t.emptyBody}</p>
        </div>
      )}
    </section>
  );
}
