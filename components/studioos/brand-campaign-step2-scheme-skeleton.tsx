"use client";

import type { Locale } from "@/lib/i18n";
import { schemeLetter } from "@/lib/studioos/brand-campaign-scheme-metrics";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const copy = {
  en: {
    compare: "Compare",
    scheme: "Scheme",
    generatingText: "Generating copy…",
    generatingImage: "Loading visuals…"
  },
  zh: {
    compare: "方案对比",
    scheme: "方案",
    generatingText: "正在生成文案…",
    generatingImage: "正在加载配图…"
  }
} as const;

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-zinc-100", className)} />;
}

export function BrandCampaignStep2SchemeSkeletonGrid({
  locale,
  phase
}: {
  locale: Locale;
  phase: "loading" | "text" | "images";
}) {
  const t = copy[locale];
  const statusLabel = phase === "images" ? t.generatingImage : t.generatingText;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <div
          key={schemeLetter(index)}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          aria-busy="true"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              {t.scheme} {schemeLetter(index)}
            </span>
            {index === 0 ? (
              <span className="text-[10px] text-violet-600">{locale === "zh" ? "推荐" : "Recommended"}</span>
            ) : (
              <span className="h-4 w-4 rounded-full border-2 border-zinc-200" />
            )}
          </div>

          {phase === "images" ? (
            <Shimmer className="mb-3 aspect-[16/10] w-full" />
          ) : (
            <div className="mb-3 flex aspect-[16/10] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            </div>
          )}

          <Shimmer className="mb-2 h-5 w-3/4" />
          <Shimmer className="mb-1 h-3 w-full" />
          <Shimmer className="mb-1 h-3 w-full" />
          <Shimmer className="h-3 w-2/3" />

          <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
            {statusLabel}
          </p>
        </div>
      ))}
    </div>
  );
}

export function BrandCampaignStep2CompareSkeleton({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm" aria-busy="true">
      <h3 className="text-sm font-semibold text-zinc-950">{t.compare}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-500">
              <th className="pb-2 pr-2 font-medium">{t.scheme}</th>
              {["A", "B", "C"].map((label) => (
                <th key={label} className="pb-2 px-1 text-center font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, row) => (
              <tr key={row} className="border-b border-zinc-50 last:border-0">
                <td className="py-2 pr-2">
                  <Shimmer className="h-3 w-16" />
                </td>
                {[0, 1, 2].map((col) => (
                  <td key={col} className="py-2 px-1 text-center">
                    <Shimmer className="mx-auto h-3 w-10" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
