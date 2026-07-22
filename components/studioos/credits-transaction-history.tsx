"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Gift,
  LoaderCircle,
  Lock,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Wallet
} from "lucide-react";
import type { CreditTransactionView } from "@/features/credit-wallet/credit-wallet.types";
import {
  creditTransactionAmountLabel,
  creditTransactionIconKind,
  creditTransactionSubtitle,
  creditTransactionTitle,
  filterTransactionsByDays,
  filterTransactionsByType,
  formatTransactionTimestamp,
  type CreditTransactionIconKind
} from "@/lib/studioos/credits-transaction-labels";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = [
  { value: "ALL", zh: "全部类型", en: "All types" },
  { value: "PURCHASE", zh: "购买", en: "Purchase" },
  { value: "BONUS", zh: "奖励", en: "Bonus" },
  { value: "EARNING_CONVERSION", zh: "兑换", en: "Conversion" },
  { value: "CAPTURE", zh: "消耗", en: "Usage" },
  { value: "REFUND", zh: "退款", en: "Refund" },
  { value: "RESERVE", zh: "冻结", en: "Frozen" },
  { value: "RELEASE", zh: "解冻", en: "Release" }
] as const;

const DAY_OPTIONS = [
  { value: 30, zh: "最近 30 天", en: "Last 30 days" },
  { value: 7, zh: "最近 7 天", en: "Last 7 days" },
  { value: 365, zh: "全部", en: "All time" }
] as const;

const COLLAPSED_LIMIT = 6;

export function CreditsTransactionHistory({
  locale,
  refreshKey = 0
}: {
  locale: Locale;
  refreshKey?: number;
}) {
  const zh = locale === "zh";
  const [rows, setRows] = useState<CreditTransactionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dayFilter, setDayFilter] = useState(30);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/credits/transactions?limit=50");
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { transactions?: CreditTransactionView[] };
      };
      if (response.ok && payload.success && payload.data?.transactions) {
        setRows(payload.data.transactions);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const filtered = useMemo(() => {
    const byType = filterTransactionsByType(rows, typeFilter);
    return filterTransactionsByDays(byType, dayFilter);
  }, [rows, typeFilter, dayFilter]);

  const visibleRows = expanded ? filtered : filtered.slice(0, COLLAPSED_LIMIT);
  const canExpand = filtered.length > COLLAPSED_LIMIT;

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">{zh ? "交易记录" : "Transaction history"}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {zh ? "所有 Token 变动记录" : "All Token balance changes"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {zh ? option.zh : option.en}
              </option>
            ))}
          </select>
          <select
            value={dayFilter}
            onChange={(event) => setDayFilter(Number(event.target.value))}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
          >
            {DAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {zh ? option.zh : option.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          {zh ? "加载中…" : "Loading…"}
        </div>
      ) : visibleRows.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-400">
          {zh ? "暂无流水" : "No transactions yet"}
        </p>
      ) : (
        <div className="mt-4 divide-y divide-zinc-100">
          {visibleRows.map((row) => (
            <TransactionRow key={row.id} row={row} locale={locale} />
          ))}
        </div>
      )}

      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          {expanded ? (zh ? "收起记录" : "Show less") : zh ? "查看全部记录" : "View all records"}
          <ChevronDown className={cn("h-4 w-4 transition", expanded && "rotate-180")} />
        </button>
      ) : null}
    </section>
  );
}

function TransactionRow({ row, locale }: { row: CreditTransactionView; locale: Locale }) {
  const kind = creditTransactionIconKind(row);
  const positive = row.amount >= 0;
  const subtitle = creditTransactionSubtitle(row, locale);

  return (
    <div className="flex items-center gap-3 py-3.5">
      <TransactionIcon kind={kind} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-zinc-950">{creditTransactionTitle(row, locale)}</div>
        <div className="mt-0.5 text-xs text-zinc-400">{formatTransactionTimestamp(row.createdAt, locale)}</div>
      </div>
      <div className="shrink-0 text-right">
        <div
          className={cn(
            "text-sm font-semibold tabular-nums",
            positive ? "text-emerald-600" : "text-zinc-900"
          )}
        >
          {creditTransactionAmountLabel(row)}
        </div>
        {subtitle ? <div className="mt-0.5 text-xs text-zinc-400">{subtitle}</div> : null}
      </div>
    </div>
  );
}

function TransactionIcon({ kind }: { kind: CreditTransactionIconKind }) {
  const className = cn(
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
    kind === "purchase" && "bg-emerald-50 text-emerald-600",
    kind === "bonus" && "bg-orange-50 text-orange-500",
    kind === "convert" && "bg-violet-50 text-violet-600",
    kind === "generate" && "bg-zinc-100 text-zinc-600",
    kind === "refund" && "bg-rose-50 text-rose-500",
    kind === "frozen" && "bg-sky-50 text-sky-600",
    kind === "release" && "bg-sky-50 text-sky-600",
    kind === "admin" && "bg-zinc-100 text-zinc-600",
    kind === "default" && "bg-zinc-100 text-zinc-500"
  );

  const icon =
    kind === "purchase" ? (
      <ShoppingBag className="h-4 w-4" />
    ) : kind === "bonus" ? (
      <Gift className="h-4 w-4" />
    ) : kind === "convert" ? (
      <Wallet className="h-4 w-4" />
    ) : kind === "generate" ? (
      <Sparkles className="h-4 w-4" />
    ) : kind === "refund" ? (
      <RotateCcw className="h-4 w-4" />
    ) : kind === "frozen" || kind === "release" ? (
      <Lock className="h-4 w-4" />
    ) : (
      <Sparkles className="h-4 w-4" />
    );

  return <div className={className}>{icon}</div>;
}
