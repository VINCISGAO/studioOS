"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { normalizeCanvasTokenBalance } from "@/lib/canvas/generation-credits";

type WalletSummary = {
  availableCredits: number;
  reservedCredits: number;
};

export function CanvasCreditsPopover({
  locale,
  tokenBalance,
  reservedCredits = 0
}: {
  locale: Locale;
  tokenBalance: number;
  reservedCredits?: number;
}) {
  const [open, setOpen] = useState(false);
  const normalizedAvailable = normalizeCanvasTokenBalance(tokenBalance);
  const normalizedReserved = normalizeCanvasTokenBalance(reservedCredits);
  const [summary, setSummary] = useState<WalletSummary>({
    availableCredits: normalizedAvailable,
    reservedCredits: normalizedReserved
  });

  useEffect(() => {
    setSummary({
      availableCredits: normalizedAvailable,
      reservedCredits: normalizedReserved
    });
  }, [normalizedAvailable, normalizedReserved]);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/v1/credits/wallet")
      .then((response) => response.json())
      .then((payload: { success?: boolean; data?: { summary?: WalletSummary } }) => {
        if (payload.success && payload.data?.summary) {
          setSummary({
            availableCredits: normalizeCanvasTokenBalance(payload.data.summary.availableCredits),
            reservedCredits: normalizeCanvasTokenBalance(payload.data.summary.reservedCredits)
          });
        }
      })
      .catch(() => undefined);
  }, [open]);

  const zh = locale === "zh";

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums text-zinc-700 hover:bg-zinc-100"
        aria-label={zh ? "VINCIS Credits" : "VINCIS Credits"}
      >
        <Zap className="h-3 w-3 text-zinc-400" strokeWidth={2.25} />
        {summary.availableCredits.toLocaleString(zh ? "zh-CN" : "en-US")}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 pt-2">
          <div className="w-64 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
            <div className="text-sm font-semibold text-zinc-950">VINCIS Credits</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">
              {summary.availableCredits.toLocaleString(zh ? "zh-CN" : "en-US")}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {zh ? "可用 Credits" : "Available credits"}
              {" · "}
              {zh ? "冻结" : "Reserved"} {summary.reservedCredits.toLocaleString()}
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                href={withLocale("/studio/credits", locale)}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-center text-xs font-medium text-white"
              >
                {zh ? "购买 Credits" : "Buy credits"}
              </Link>
              <Link
                href={withLocale("/studio/credits", locale)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-center text-xs font-medium text-zinc-700"
              >
                {zh ? "使用收益兑换" : "Convert earnings"}
              </Link>
              <Link
                href={withLocale("/studio/credits", locale)}
                className="text-center text-xs text-zinc-500 hover:text-zinc-800"
              >
                {zh ? "查看明细" : "View details"}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
