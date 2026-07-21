"use client";

import { useState } from "react";
import { Infinity, Rocket, Zap } from "lucide-react";
import { PortalAccountAvatar } from "@/components/studioos/portal-account-avatar";
import { usePortalShellChrome } from "@/components/studioos/portal-shell-chrome-context";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type GenerationMode = "fast" | "queue";

export function CanvasCreditsHud({
  locale,
  tokenBalance
}: {
  locale: Locale;
  tokenBalance: number;
}) {
  const chrome = usePortalShellChrome();
  const [generationMode, setGenerationMode] = useState<GenerationMode>("fast");
  const [showFastTip, setShowFastTip] = useState(false);

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-30 flex items-center">
      <div className="pointer-events-auto relative flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white/90 px-1 py-0.5 shadow-sm backdrop-blur-sm">
        <div
          className="relative flex items-center rounded-full bg-zinc-100/90 p-px"
          onMouseEnter={() => generationMode === "fast" && setShowFastTip(true)}
          onMouseLeave={() => setShowFastTip(false)}
        >
          <button
            type="button"
            aria-label={locale === "zh" ? "快速生成" : "Fast generation"}
            aria-pressed={generationMode === "fast"}
            onClick={() => setGenerationMode("fast")}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full transition",
              generationMode === "fast"
                ? "bg-white text-zinc-800 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <Rocket className="h-3 w-3" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label={locale === "zh" ? "排队生成" : "Queue generation"}
            aria-pressed={generationMode === "queue"}
            onClick={() => setGenerationMode("queue")}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full transition",
              generationMode === "queue"
                ? "bg-white text-zinc-800 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <Infinity className="h-3 w-3" strokeWidth={2.25} />
          </button>
          {showFastTip ? (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-lg bg-zinc-900 px-2.5 py-2 text-left text-white shadow-lg">
              <div className="text-[11px] font-medium">
                {locale === "zh" ? "快速生成" : "Fast generation"}
              </div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-300">
                {locale === "zh"
                  ? "使用积分跳过排队，立即处理您的请求。"
                  : "Use tokens to skip the queue and process your request immediately."}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1 px-1.5">
          <Zap className="h-3 w-3 text-zinc-400" strokeWidth={2.25} />
          <span className="min-w-[2ch] text-xs font-medium tabular-nums text-zinc-700">
            {tokenBalance.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
          </span>
        </div>

        {chrome ? (
          <div
            className="pointer-events-none shrink-0 select-none"
            aria-hidden
          >
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
