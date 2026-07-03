"use client";

import type { Locale } from "@/lib/i18n";
import type { ReviewFocusTheme } from "@/lib/studioos/portal-focus-mode";
import { cn } from "@/lib/utils";

export function ReviewerFocusStrokeControls({
  locale,
  penColor,
  penSize,
  onPenColorChange,
  onPenSizeChange,
  layout = "sidebar",
  theme = "light"
}: {
  locale: Locale;
  penColor: string;
  penSize: number;
  onPenColorChange: (value: string) => void;
  onPenSizeChange: (value: number) => void;
  layout?: "sidebar" | "inline" | "dock";
  theme?: ReviewFocusTheme;
}) {
  const colorLabel = locale === "zh" ? "描边颜色" : "Stroke color";
  const sizeLabel = locale === "zh" ? "线条粗细" : "Stroke width";
  const isDark = theme === "dark";
  const isDock = layout === "dock";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2",
        isDock
          ? cn("rounded-xl border px-2 py-1.5", isDark ? "border-zinc-700 bg-zinc-900/80" : "border-zinc-200 bg-white")
          : cn(
              "flex-col rounded-2xl border p-2 shadow-md",
              layout === "sidebar" ? "w-[52px]" : "w-[88px]",
              isDark ? "border-zinc-700 bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)]" : "border-zinc-200/90 bg-white"
            )
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-lg border p-0.5",
          isDock ? "h-8 w-8" : "rounded-xl p-1",
          isDark ? "border-zinc-700 bg-zinc-950" : "border-zinc-200 bg-white"
        )}
      >
        <div
          className={cn(
            "rounded-md border border-zinc-100 shadow-inner",
            isDock ? "h-6 w-6 rounded-md" : "h-7 w-7 rounded-lg"
          )}
          style={{ backgroundColor: penColor }}
          aria-hidden
        />
        <input
          type="color"
          value={penColor}
          onChange={(event) => onPenColorChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={colorLabel}
        />
      </div>

      <input
        type="range"
        min={1}
        max={6}
        step={1}
        value={penSize}
        onChange={(event) => onPenSizeChange(Number(event.target.value))}
        aria-label={sizeLabel}
        className={cn(
          "h-1.5 cursor-pointer appearance-none rounded-full",
          isDock ? "w-16" : layout === "sidebar" ? "w-10" : "w-[72px]",
          isDark ? "bg-zinc-700" : "bg-zinc-200",
          "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-zinc-200 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm",
          "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-200 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm"
        )}
      />
    </div>
  );
}

export const REVIEWER_FOCUS_STROKE_TOOLS = ["arrow", "pen", "circle", "rect", "text"] as const;
