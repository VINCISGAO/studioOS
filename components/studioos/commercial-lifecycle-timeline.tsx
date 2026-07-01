"use client";

import type { Locale } from "@/lib/i18n";
import {
  brandUserPhaseLabel,
  brandUserPhaseLabels,
  brandUserPhaseSubtitles,
  creatorUserPhaseLabel,
  creatorUserPhaseLabels,
  creatorUserPhaseSubtitles,
  mapBrandStepToPhase,
  mapCreatorStepToPhase,
  resolveBrandNextActorHint,
  resolveCreatorNextActorHint,
  userCommercialPhaseIndex,
  userCommercialPhases,
  type BrandCommercialStep,
  type CreatorCommercialStep,
  type UserCommercialPhase
} from "@/lib/studioos/commercial-lifecycle";
import { portalChrome } from "@/lib/studioos/product-theme";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const copy = {
  en: {
    brandTitle: "Project progress",
    creatorTitle: "Project progress",
    current: "Current stage",
    next: "Next step"
  },
  zh: {
    brandTitle: "项目进度",
    creatorTitle: "项目进度",
    current: "当前阶段",
    next: "下一步"
  }
};

function UserPhaseTimeline({
  locale,
  side,
  currentPhase,
  nextHint,
  compact = false
}: {
  locale: Locale;
  side: "brand" | "creator";
  currentPhase: UserCommercialPhase;
  nextHint: string;
  compact?: boolean;
}) {
  const t = copy[locale];
  const currentIndex = userCommercialPhaseIndex(currentPhase);
  const phaseLabels = side === "brand" ? brandUserPhaseLabels[locale] : creatorUserPhaseLabels[locale];
  const phaseSubtitles = side === "brand" ? brandUserPhaseSubtitles[locale] : creatorUserPhaseSubtitles[locale];
  const currentLabel = side === "brand" ? brandUserPhaseLabel(currentPhase, locale) : creatorUserPhaseLabel(currentPhase, locale);

  return (
    <section className={cn(portalChrome.card, compact ? "p-4 sm:p-5" : "p-5 sm:p-6")}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-zinc-950">{side === "brand" ? t.brandTitle : t.creatorTitle}</h2>
        <span className="w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
          {t.current}: {currentLabel}
        </span>
      </div>

      <ol className="space-y-0">
        {userCommercialPhases.map((phase, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const upcoming = index > currentIndex;

          return (
            <li key={phase}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-3",
                  active && "bg-indigo-50 ring-1 ring-indigo-100",
                  done && !active && "text-zinc-700",
                  upcoming && "text-zinc-400"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    done ? "bg-zinc-900 text-white" : active ? "bg-indigo-600 text-white" : "border border-zinc-200 bg-white text-zinc-400"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold leading-snug", active && "text-indigo-950")}>
                    {phaseLabels[phase]}
                  </p>
                  {(active || done) && (
                    <p className={cn("mt-0.5 text-xs leading-relaxed", active ? "text-indigo-800/80" : "text-zinc-500")}>
                      {phaseSubtitles[phase]}
                    </p>
                  )}
                </div>
              </div>
              {index < userCommercialPhases.length - 1 ? (
                <div className="ml-[23px] flex h-5 items-center">
                  <span className="h-full w-px bg-zinc-200" aria-hidden />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700">
        <span className="font-medium text-zinc-900">{t.next}：</span>
        {nextHint.replace(/^(下一步：|Next: )/, "")}
      </p>
    </section>
  );
}

export function BrandCommercialTimeline({
  locale,
  currentStep,
  compact = false,
  orderStatus = null,
  hasOpenComments = false
}: {
  locale: Locale;
  currentStep: BrandCommercialStep;
  compact?: boolean;
  orderStatus?: string | null;
  hasOpenComments?: boolean;
}) {
  const currentPhase = mapBrandStepToPhase(currentStep);

  return (
    <UserPhaseTimeline
      locale={locale}
      side="brand"
      currentPhase={currentPhase}
      nextHint={resolveBrandNextActorHint(currentStep, locale, { orderStatus, hasOpenComments })}
      compact={compact}
    />
  );
}

export function CreatorCommercialTimeline({
  locale,
  currentStep,
  compact = false,
  orderStatus = null
}: {
  locale: Locale;
  currentStep: CreatorCommercialStep;
  compact?: boolean;
  orderStatus?: string | null;
}) {
  const currentPhase = mapCreatorStepToPhase(currentStep);

  return (
    <UserPhaseTimeline
      locale={locale}
      side="creator"
      currentPhase={currentPhase}
      nextHint={resolveCreatorNextActorHint(currentStep, locale, { orderStatus })}
      compact={compact}
    />
  );
}

export {
  brandCommercialPhaseLabel,
  creatorCommercialPhaseLabel
} from "@/lib/studioos/commercial-lifecycle";
