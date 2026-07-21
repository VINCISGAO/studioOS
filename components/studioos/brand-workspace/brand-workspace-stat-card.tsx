"use client";

import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandWorkspaceStatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconTone: string;
  waveTone: string;
  monthLabel: string;
  delta: string;
  /** When set, replaces the month + delta footer (e.g. creator verification sublabel). */
  comparisonText?: string;
  /** Status cards (e.g. certification) should hide the decorative trend line. */
  showSparkline?: boolean;
  /** Status layout stacks label + value; metric layout centers the number. */
  layout?: "metric" | "status";
};

const SPARKLINE_PATHS = {
  up: "M2 22 C18 18, 28 20, 42 12 S68 14, 88 6",
  flat: "M2 16 C22 14, 38 17, 54 15 S74 16, 88 14"
} as const;

function BrandWorkspaceStatSparkline({
  className,
  variant = "up"
}: {
  className?: string;
  variant?: keyof typeof SPARKLINE_PATHS;
}) {
  const gradientId = useId();
  const linePath = SPARKLINE_PATHS[variant];
  const fillPath = `${linePath} L88 32 L2 32 Z`;

  return (
    <svg viewBox="0 0 88 32" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function BrandWorkspaceStatCard({
  label,
  value,
  icon: Icon,
  iconTone,
  waveTone,
  monthLabel,
  delta,
  comparisonText,
  showSparkline = true,
  layout = "metric"
}: BrandWorkspaceStatCardProps) {
  const deltaUp = delta !== "--" && delta !== "0%";
  const compactValue = typeof value === "string" && value.length > 4;

  if (layout === "status") {
    return (
      <div
        className="flex min-h-[128px] flex-col rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)] sm:min-h-[140px] sm:p-5"
        aria-label={label}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10",
              iconTone
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <p className="text-xs font-medium text-zinc-500">{label}</p>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px]">
          {value}
        </p>
        {comparisonText ? (
          <p className="mt-auto pt-4 text-xs leading-5 text-zinc-400">{comparisonText}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[128px] overflow-hidden rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.1)] sm:min-h-[140px] sm:p-5"
      aria-label={label}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10",
              iconTone
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <p className="text-xs font-medium text-zinc-500">{label}</p>
        </div>
        <p
          className={cn(
            "mt-3 font-semibold tracking-tight text-zinc-950",
            compactValue ? "text-xl sm:text-2xl" : "text-[30px] tabular-nums sm:text-[34px]"
          )}
        >
          {value}
        </p>
      </div>

      <p className="absolute bottom-4 left-4 z-10 max-w-[58%] text-xs text-zinc-400">
        {comparisonText ?? (
          <>
            {monthLabel}{" "}
            <span className={cn(deltaUp ? "font-medium text-emerald-500" : "text-zinc-400")}>
              {deltaUp ? "↑ " : ""}
              {delta}
            </span>
          </>
        )}
      </p>

      {showSparkline ? (
        <BrandWorkspaceStatSparkline
          variant={deltaUp ? "up" : "flat"}
          className={cn(
            "pointer-events-none absolute bottom-2.5 right-2 h-10 w-[84px] sm:bottom-3 sm:right-2.5 sm:h-11 sm:w-[92px]",
            waveTone
          )}
        />
      ) : null}
    </div>
  );
}
