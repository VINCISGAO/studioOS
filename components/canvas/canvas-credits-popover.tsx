"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Coins,
  RefreshCw,
  ShoppingCart,
  X,
  Zap
} from "lucide-react";
import {
  CANVAS_CREDITS_POPOVER,
  canvasCreditsPopoverCopy
} from "@/lib/canvas/canvas-credits-popover-design";
import { normalizeCanvasTokenBalance } from "@/lib/canvas/generation-credits";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { creatorPortalRoutes } from "@/lib/studioos/creator-portal-routes";
import { cn } from "@/lib/utils";

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

  const copy = canvasCreditsPopoverCopy[locale];
  const creditsHref = withLocale(creatorPortalRoutes.credits, locale);
  const convertHref = `${creditsHref}#convert`;
  const detailsHref = `${creditsHref}#history`;
  const formattedAvailable = summary.availableCredits.toLocaleString(
    locale === "zh" ? "zh-CN" : "en-US"
  );
  const formattedReserved = summary.reservedCredits.toLocaleString(
    locale === "zh" ? "zh-CN" : "en-US"
  );

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
        aria-label={copy.title}
        aria-expanded={open}
      >
        <Zap className="h-3 w-3 text-zinc-400" strokeWidth={2.25} />
        {formattedAvailable}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 pt-2">
          <div className={cn(CANVAS_CREDITS_POPOVER.width, CANVAS_CREDITS_POPOVER.shell)}>
            <div className={CANVAS_CREDITS_POPOVER.header}>
              <div className={CANVAS_CREDITS_POPOVER.headerLead}>
                <span className={CANVAS_CREDITS_POPOVER.headerIcon}>
                  <Coins className={CANVAS_CREDITS_POPOVER.headerIconGlyph} strokeWidth={2.25} />
                </span>
                <div className={CANVAS_CREDITS_POPOVER.title}>{copy.title}</div>
              </div>
              <button
                type="button"
                aria-label={locale === "zh" ? "关闭" : "Close"}
                onClick={() => setOpen(false)}
                className={CANVAS_CREDITS_POPOVER.closeButton}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </div>

            <div className={CANVAS_CREDITS_POPOVER.balanceRow}>
              <span className={CANVAS_CREDITS_POPOVER.balanceValue}>{formattedAvailable}</span>
              <span className={CANVAS_CREDITS_POPOVER.balanceBadge}>
                <Zap className={CANVAS_CREDITS_POPOVER.balanceBadgeIcon} strokeWidth={2.25} />
              </span>
            </div>
            <p className={CANVAS_CREDITS_POPOVER.balanceMeta}>
              {copy.available} · {copy.reserved} {formattedReserved}
            </p>

            <div className={CANVAS_CREDITS_POPOVER.actions}>
              <Link href={creditsHref} className={CANVAS_CREDITS_POPOVER.buyButton}>
                <ShoppingCart className="h-4 w-4" strokeWidth={2.25} />
                {copy.buy}
              </Link>
              <Link href={convertHref} className={CANVAS_CREDITS_POPOVER.convertButton}>
                <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
                {copy.convert}
              </Link>
            </div>

            <Link href={detailsHref} className={CANVAS_CREDITS_POPOVER.detailsLink}>
              {copy.details}
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
