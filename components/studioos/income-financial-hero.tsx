"use client";

import type { CreatorIncomeSnapshot } from "@/lib/studioos/withdrawal-types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";
import { CircleHelp, Clock3, Landmark, Shield, Sparkles, TrendingUp, Wallet } from "lucide-react";

const copy = {
  zh: {
    eyebrow: "STUDIO 财务中心",
    readyToWithdraw: "可立即提现",
    escrowNote: "托管资金在 Brand 验收通过后释放",
    secured: "平台托管保障",
    withdraw: "申请提现",
    addMethod: "添加收款方式",
    held: "托管中",
    heldHint: "等待品牌验收",
    pending: "提现处理中",
    pendingHint: "审核中或处理中",
    lifetime: "累计已提现",
    lifetimeHint: "所有成功提现金额"
  },
  en: {
    eyebrow: "STUDIO FINANCIAL CENTER",
    readyToWithdraw: "Available now",
    escrowNote: "Escrow releases after brand approval",
    secured: "Platform escrow protection",
    withdraw: "Request withdrawal",
    addMethod: "Add payout method",
    held: "In escrow",
    heldHint: "Awaiting brand approval",
    pending: "Processing",
    pendingHint: "Under review or payout",
    lifetime: "Total withdrawn",
    lifetimeHint: "All successful withdrawals"
  }
} as const;

function MetricTile({
  label,
  hint,
  value,
  icon: Icon,
  tone
}: {
  label: string;
  hint: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: "amber" | "zinc" | "emerald";
}) {
  const iconTone =
    tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-zinc-900";

  return (
    <div className="rounded-[18px] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-700">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950">{value}</p>
          <p className="mt-1 text-xs text-zinc-400">{hint}</p>
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white", iconTone)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export function IncomeFinancialHero({
  locale,
  snapshot,
  canWithdraw,
  onWithdraw,
  onAddMethod
}: {
  locale: "en" | "zh";
  snapshot: CreatorIncomeSnapshot;
  canWithdraw: boolean;
  onWithdraw: () => void;
  onAddMethod: () => void;
}) {
  const t = copy[locale];

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-zinc-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f8faf9_100%)] p-6 sm:p-8">
      <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-400">{t.eyebrow}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            {t.readyToWithdraw}
            <CircleHelp className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-5xl font-semibold tracking-tight text-zinc-950 sm:text-[3.25rem]">
            {formatCurrency(snapshot.available_usd, locale)}{" "}
            <span className="text-3xl font-semibold text-zinc-500 sm:text-4xl">USD</span>
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">{t.escrowNote}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <Shield className="h-3.5 w-3.5" />
            {t.secured}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            className="h-11 rounded-xl bg-emerald-600 px-6 hover:bg-emerald-700"
            onClick={onWithdraw}
            disabled={!canWithdraw}
          >
            <Wallet className="h-4 w-4" /> {t.withdraw}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 rounded-xl border-zinc-200 bg-white px-6"
            onClick={onAddMethod}
          >
            <Landmark className="h-4 w-4" /> {t.addMethod}
          </Button>
        </div>
      </div>

      <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
        <MetricTile
          label={t.held}
          hint={t.heldHint}
          value={formatCurrency(snapshot.held_usd, locale)}
          icon={Clock3}
          tone="amber"
        />
        <MetricTile
          label={t.pending}
          hint={t.pendingHint}
          value={formatCurrency(snapshot.pending_withdrawal_usd, locale)}
          icon={TrendingUp}
          tone="zinc"
        />
        <MetricTile
          label={t.lifetime}
          hint={t.lifetimeHint}
          value={formatCurrency(snapshot.lifetime_withdrawn_usd, locale)}
          icon={Sparkles}
          tone="emerald"
        />
      </div>
    </section>
  );
}
