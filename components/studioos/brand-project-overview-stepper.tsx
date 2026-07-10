"use client";

import type { Locale } from "@/lib/i18n";
import {
  brandUserPhaseLabels,
  mapBrandStepToPhase,
  userCommercialPhaseIndex,
  userCommercialPhases,
  type BrandCommercialContext,
  type BrandCommercialStep,
  type UserCommercialPhase
} from "@/lib/studioos/commercial-lifecycle";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

function phaseSubtitle(
  locale: Locale,
  phase: UserCommercialPhase,
  acceptedCount: number
): string {
  if (phase === "in_production" && acceptedCount > 0) {
    return locale === "zh"
      ? `${acceptedCount} 位创作者已接受`
      : `${acceptedCount} creator${acceptedCount === 1 ? "" : "s"} accepted`;
  }
  const subtitles = {
    en: {
      publish_requirement: "Requirements published",
      recruiting: "Invitations sent to creators",
      in_production: "Creator is producing",
      completed: "Escrow released automatically"
    },
    zh: {
      publish_requirement: "需求已发布",
      recruiting: "已向创作者发出邀请",
      in_production: "创作者制作中",
      completed: "托管款已自动释放"
    }
  };
  return subtitles[locale][phase];
}

export function BrandProjectOverviewStepper({
  locale,
  brandCommercialStep,
  commercialContext,
  acceptedCount = 0
}: {
  locale: Locale;
  brandCommercialStep: BrandCommercialStep;
  commercialContext: BrandCommercialContext;
  acceptedCount?: number;
}) {
  const currentPhase = mapBrandStepToPhase(brandCommercialStep, commercialContext);
  const currentIndex = userCommercialPhaseIndex(currentPhase);
  const labels = brandUserPhaseLabels[locale];

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
                  {phaseSubtitle(locale, phase, acceptedCount)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
