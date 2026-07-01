import type { Locale } from "@/lib/i18n";
import type { CreativePerformanceRecord } from "@/lib/studioos/creative-performance-types";
import { ChevronRight, TrendingUp } from "lucide-react";

type Props = {
  locale: Locale;
  linked: CreativePerformanceRecord;
  linkedLabel: string;
};

export function AttributionLinkedBanner({ locale, linked, linkedLabel }: Props) {
  const completionLabel = locale === "zh" ? "完播" : "Completion";
  const metrics = [
    linked.platform.toUpperCase(),
    `CTR ${linked.metrics.ctr.toFixed(1)}%`,
    `${completionLabel} ${linked.metrics.completion_rate.toFixed(0)}%`,
    linked.metrics.roas != null ? `ROAS ${linked.metrics.roas.toFixed(1)}` : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="border-b bg-emerald-50/70 px-5 py-3.5 sm:px-6">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-start gap-2">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="font-medium text-emerald-900">
              {linkedLabel}: {linked.name}
            </p>
            <p className="mt-1 font-mono text-[12px] tracking-tight text-emerald-800/90">{metrics}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-emerald-700/70" />
      </div>
    </div>
  );
}
