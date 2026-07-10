"use client";

import type { Locale } from "@/lib/i18n";
import {
  creatorUserPhaseLabels,
  mapCreatorStepToPhase,
  userCommercialPhaseIndex,
  userCommercialPhases,
  type CreatorCommercialContext,
  type CreatorCommercialStep
} from "@/lib/studioos/commercial-lifecycle";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

function phaseSubtitle(locale: Locale, phase: string, step: CreatorCommercialStep): string {
  if (phase === "in_production") {
    return locale === "zh" ? "创作进行中" : "Creation in progress";
  }
  if (phase === "completed") {
    return locale === "zh" ? "待最终交付" : "Awaiting final delivery";
  }
  if (step === "matching_order" || step === "waiting_brand_selection") {
    return locale === "zh" ? "等待品牌选择" : "Awaiting brand selection";
  }
  const dates = {
    publish_requirement: locale === "zh" ? "需求已发布" : "Requirements posted",
    recruiting: locale === "zh" ? "邀请已发出" : "Invitations sent"
  };
  return dates[phase as keyof typeof dates] ?? "";
}

export function CreatorProjectOverviewStepper({
  locale,
  creatorCommercialStep,
  commercialContext,
  createdAt,
  selectedAt
}: {
  locale: Locale;
  creatorCommercialStep: CreatorCommercialStep;
  commercialContext: CreatorCommercialContext;
  createdAt?: string | null;
  selectedAt?: string | null;
}) {
  const currentPhase = mapCreatorStepToPhase(creatorCommercialStep, commercialContext);
  const currentIndex = userCommercialPhaseIndex(currentPhase);
  const labels = creatorUserPhaseLabels[locale];

  const stepDates = [
    createdAt?.split("T")[0] ?? "",
    selectedAt?.split("T")[0] ?? createdAt?.split("T")[0] ?? "",
    "",
    ""
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <ol className="grid gap-4 px-5 py-5 sm:grid-cols-4 sm:px-6">
        {userCommercialPhases.map((phase, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={phase} className="relative min-w-0">
              {index < userCommercialPhases.length - 1 ? (
                <span
                  className={cn(
                    "absolute left-[calc(50%+16px)] top-4 hidden h-px w-[calc(100%-32px)] sm:block",
                    done ? "bg-violet-300" : "bg-zinc-200"
                  )}
                  aria-hidden
                />
              ) : null}
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                    done || active ? "bg-violet-600 text-white" : "border border-zinc-200 bg-white text-zinc-400"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <p className={cn("mt-2 text-sm font-semibold", active ? "text-violet-700" : done ? "text-zinc-800" : "text-zinc-400")}>
                  {labels[phase]}
                </p>
                <p className={cn("mt-1 text-xs leading-relaxed", active ? "text-violet-600/90" : "text-zinc-400")}>
                  {stepDates[index] || phaseSubtitle(locale, phase, creatorCommercialStep)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
