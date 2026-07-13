"use client";

import {
  CommercialProjectOverviewStepper,
  type CommercialOverviewStep
} from "@/components/studioos/commercial-project-overview-stepper";
import type { Locale } from "@/lib/i18n";
import {
  creatorUserPhaseLabels,
  mapCreatorStepToPhase,
  userCommercialPhaseIndex,
  userCommercialPhases,
  type CreatorCommercialContext,
  type CreatorCommercialStep
} from "@/lib/studioos/commercial-lifecycle";

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

  const steps: CommercialOverviewStep[] = userCommercialPhases.map((phase, index) => ({
    label: labels[phase],
    subtitle: stepDates[index] || phaseSubtitle(locale, phase, creatorCommercialStep)
  }));

  return <CommercialProjectOverviewStepper steps={steps} currentIndex={currentIndex} />;
}
