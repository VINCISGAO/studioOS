"use client";

import {
  CommercialProjectOverviewStepper,
  type CommercialOverviewStep
} from "@/components/studioos/commercial-project-overview-stepper";
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
  const steps: CommercialOverviewStep[] = userCommercialPhases.map((phase) => ({
    label: labels[phase],
    subtitle: phaseSubtitle(locale, phase, acceptedCount)
  }));

  return <CommercialProjectOverviewStepper steps={steps} currentIndex={currentIndex} />;
}
