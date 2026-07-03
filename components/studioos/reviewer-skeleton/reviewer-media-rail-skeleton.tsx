"use client";

import { cn } from "@/lib/utils";

const TICK_SLOTS = [0, 20, 40, 60, 80, 100];

export function ReviewerRailShimmer({
  className,
  rounded = "rounded-lg"
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-zinc-100/90", rounded, className)}>
      <div
        className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-100 via-white/80 to-zinc-100"
        aria-hidden
      />
    </div>
  );
}

export function ReviewerTimelineLoadingSkeleton({
  label,
  compact = false,
  expandedLayout = false
}: {
  label: string;
  compact?: boolean;
  expandedLayout?: boolean;
}) {
  const tickRowClass = expandedLayout ? "mb-1.5 h-4" : compact ? "mb-1 h-3" : "mb-1.5 h-4";
  const trackClass = expandedLayout ? "h-10" : compact ? "h-8" : "h-10";

  return (
    <section
      className={cn(
        expandedLayout ? "w-full" : "rounded-xl border border-zinc-200/80 bg-white shadow-sm",
        !expandedLayout && (compact ? "p-2" : "p-3")
      )}
      aria-busy="true"
      aria-label={label}
    >
      <div
        className={cn(
          "font-medium text-zinc-900",
          expandedLayout ? "mb-3 text-sm" : "mb-2 text-xs text-zinc-700"
        )}
      >
        {label}
      </div>

      {expandedLayout ? <div className="mb-2 h-6" /> : null}

      <div className={cn("relative", tickRowClass)}>
        {TICK_SLOTS.map((left, index) => (
          <span
            key={left}
            className={cn(
              "absolute h-2 rounded-full bg-zinc-100",
              index === 0 && "w-7",
              index === TICK_SLOTS.length - 1 && "w-7 -translate-x-full",
              index > 0 && index < TICK_SLOTS.length - 1 && "w-8 -translate-x-1/2"
            )}
            style={{ left: `${left}%` }}
          >
            <span className="block h-full w-full animate-pulse rounded-full bg-zinc-100/90" />
          </span>
        ))}
      </div>

      <ReviewerRailShimmer className={trackClass} rounded="rounded-lg" />
    </section>
  );
}

export function ReviewerFilmstripLoadingSkeleton({
  compact = false,
  expanded = false,
  focusLayout = false,
  frameCount = 24
}: {
  compact?: boolean;
  expanded?: boolean;
  focusLayout?: boolean;
  frameCount?: number;
}) {
  const thumbClass = focusLayout
    ? "h-8 w-8 md:h-14 md:w-14 lg:h-16 lg:w-16"
    : expanded
      ? "h-16 w-[72px]"
      : compact
        ? "h-10 w-[42px]"
        : "h-14 w-[58px]";

  return (
    <section
      className={cn(
        focusLayout ? "w-full" : "rounded-xl border border-zinc-200/80 bg-white shadow-sm",
        !focusLayout && (compact ? "p-2" : "p-3")
      )}
      aria-busy="true"
    >
      <div className={cn("flex overflow-hidden", focusLayout ? "gap-1.5" : "gap-1")}>
        {Array.from({ length: frameCount }, (_, index) => (
          <ReviewerRailShimmer key={index} rounded={focusLayout ? "rounded-lg" : "rounded-md"} className={cn("shrink-0", thumbClass)} />
        ))}
      </div>
    </section>
  );
}
