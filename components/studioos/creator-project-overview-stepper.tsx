"use client";

import {
  CommercialProjectOverviewStepper,
  type CommercialOverviewStep
} from "@/components/studioos/commercial-project-overview-stepper";
import type { Locale } from "@/lib/i18n";
import {
  creatorUserCommercialPhaseLabels,
  creatorUserCommercialPhaseIndex,
  creatorUserCommercialPhases,
  mapCreatorStepToUserPhase,
  type CreatorCommercialContext,
  type CreatorCommercialStep,
  type CreatorUserCommercialPhase
} from "@/lib/studioos/commercial-lifecycle";

function phaseSubtitle(locale: Locale, phase: CreatorUserCommercialPhase, step: CreatorCommercialStep): string {
  if (phase === "project_start") {
    return locale === "zh" ? "创作进行中" : "Creation in progress";
  }
  if (phase === "final_delivery") {
    return locale === "zh" ? "待最终交付" : "Awaiting final delivery";
  }
  if (step === "matching_order" || step === "waiting_brand_selection") {
    return locale === "zh" ? "等待品牌选择" : "Awaiting brand selection";
  }
  const dates = {
    invitation: locale === "zh" ? "邀请已收到" : "Invitation received",
    cooperation: locale === "zh" ? "双方确认中" : "Confirming partnership"
  };
  return dates[phase] ?? "";
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
  const currentPhase = mapCreatorStepToUserPhase(creatorCommercialStep, commercialContext);
  const currentIndex = creatorUserCommercialPhaseIndex(currentPhase);
  const labels = creatorUserCommercialPhaseLabels[locale];

  const stepDates = [
    createdAt?.split("T")[0] ?? "",
    selectedAt?.split("T")[0] ?? createdAt?.split("T")[0] ?? "",
    "",
    ""
  ];

  const steps: CommercialOverviewStep[] = creatorUserCommercialPhases.map((phase, index) => ({
    label: labels[phase],
    subtitle: stepDates[index] || phaseSubtitle(locale, phase, creatorCommercialStep)
  }));

  return <CommercialProjectOverviewStepper steps={steps} currentIndex={currentIndex} />;
}
