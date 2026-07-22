"use client";

import { useState } from "react";
import { Infinity, Rocket } from "lucide-react";
import { CanvasCreditsPopover } from "@/components/canvas/canvas-credits-popover";
import { CanvasQueueGenerationPopover } from "@/components/canvas/canvas-queue-generation-popover";
import { PortalAccountAvatar } from "@/components/studioos/portal-account-avatar";
import { usePortalShellChrome } from "@/components/studioos/portal-shell-chrome-context";
import { normalizeCanvasTokenBalance } from "@/lib/canvas/generation-credits";
import { queueGenerationCopy } from "@/lib/canvas/queue-generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type GenerationMode = "fast" | "queue";

export function CanvasCreditsHud({
  locale,
  tokenBalance,
  reservedCredits = 0
}: {
  locale: Locale;
  tokenBalance: number;
  reservedCredits?: number;
}) {
  const chrome = usePortalShellChrome();
  const copy = queueGenerationCopy(locale);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("fast");
  const [showFastTip, setShowFastTip] = useState(false);
  const [showQueuePopover, setShowQueuePopover] = useState(false);
  const displayBalance = normalizeCanvasTokenBalance(tokenBalance);

  function openQueuePopover() {
    setGenerationMode("queue");
    setShowQueuePopover(true);
    setShowFastTip(false);
  }

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-30 flex items-center">
      <div className="pointer-events-auto relative flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white/90 px-1 py-0.5 shadow-sm backdrop-blur-sm">
        <div className="relative flex items-center rounded-full bg-zinc-100/90 p-px">
          <button
            type="button"
            aria-label={copy.fastAria}
            aria-pressed={generationMode === "fast"}
            onClick={() => {
              setGenerationMode("fast");
              setShowQueuePopover(false);
            }}
            onMouseEnter={() => {
              setShowFastTip(true);
              setShowQueuePopover(false);
            }}
            onMouseLeave={() => setShowFastTip(false)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full transition",
              generationMode === "fast"
                ? "bg-white text-zinc-800 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <Rocket className="h-3 w-3" strokeWidth={2.25} />
          </button>
          <div
            className="relative"
            onMouseLeave={() => setShowQueuePopover(false)}
          >
            <button
              type="button"
              aria-label={copy.queueAria}
              aria-pressed={generationMode === "queue"}
              onClick={openQueuePopover}
              onMouseEnter={openQueuePopover}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full transition",
                generationMode === "queue"
                  ? "bg-white text-zinc-800 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <Infinity className="h-3 w-3" strokeWidth={2.25} />
            </button>
            {showQueuePopover ? (
              <div className="absolute right-0 top-full z-50 pt-2">
                <CanvasQueueGenerationPopover locale={locale} title={copy.title} />
              </div>
            ) : null}
          </div>

          {showFastTip ? (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-lg bg-zinc-900 px-2.5 py-2 text-left text-white shadow-lg">
              <div className="text-[11px] font-medium">{copy.fastTitle}</div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-300">{copy.fastHint}</p>
            </div>
          ) : null}
        </div>

        <div className="px-0.5">
          <CanvasCreditsPopover
            locale={locale}
            tokenBalance={displayBalance}
            reservedCredits={reservedCredits}
          />
        </div>

        {chrome ? (
          <div className="pointer-events-none shrink-0 select-none" aria-hidden>
            <PortalAccountAvatar
              initials={chrome.initials}
              avatarUrl={chrome.avatarUrl}
              size="sm"
              accent="indigo"
              className="!h-6 !w-6 text-[10px]"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
