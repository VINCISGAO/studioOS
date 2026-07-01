"use client";

import type { Locale } from "@/lib/i18n";
import {
  closedLoopProgressIndex,
  closedLoopStepLabels,
  closedLoopSteps,
  type ClosedLoopStep
} from "@/lib/studioos/campaign-closed-loop";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const copy = {
  en: { title: "Commercial loop", current: "You are here" },
  zh: { title: "商业闭环", current: "当前阶段" }
};

export function CampaignClosedLoopTimeline({
  locale,
  currentStep,
  compact = false
}: {
  locale: Locale;
  currentStep: ClosedLoopStep;
  compact?: boolean;
}) {
  const t = copy[locale];
  const labels = closedLoopStepLabels[locale];
  const currentIndex = closedLoopProgressIndex(currentStep);

  return (
    <section className={cn(portalChrome.card, compact ? "p-4 sm:p-5" : "p-5 sm:p-6")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-950">{t.title}</h2>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
          {t.current}: {labels[currentStep]}
        </span>
      </div>
      <ol className={cn("grid gap-2", compact ? "sm:grid-cols-2" : "lg:grid-cols-2")}>
        {closedLoopSteps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              key={step}
              className={cn(
                "flex items-start gap-2 rounded-xl px-3 py-2 text-sm",
                active && "bg-indigo-50 text-indigo-950 ring-1 ring-indigo-100",
                done && !active && "text-zinc-600",
                !done && !active && "text-zinc-400"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  done ? "bg-zinc-900 text-white" : active ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-400"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span className="leading-snug">{labels[step]}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
