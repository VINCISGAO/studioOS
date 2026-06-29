"use client";

import type { Locale } from "@/lib/i18n";
import {
  CAMPAIGN_WIZARD_STEP_COUNT,
  CAMPAIGN_WIZARD_STEPS,
  clampWizardStep,
  completedWizardSteps,
  wizardProgressPercent
} from "@/lib/campaign/wizard-steps";
import { wizard } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type WizardStepperProps = {
  locale: Locale;
  currentStep: number;
  completedSteps?: number[];
  className?: string;
  compact?: boolean;
};

export function WizardStepper({
  locale,
  currentStep,
  completedSteps,
  className,
  compact = false
}: WizardStepperProps) {
  const current = clampWizardStep(currentStep);
  const done = new Set(completedSteps ?? completedWizardSteps(current));
  const percent = wizardProgressPercent(current);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-caption">
        <span>
          {locale === "zh" ? "第" : "Step"} {current}{" "}
          {locale === "zh" ? "步，共" : "of"} {CAMPAIGN_WIZARD_STEP_COUNT}{" "}
          {locale === "zh" ? "步" : "steps"}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-page"
          style={{ width: `${percent}%` }}
        />
      </div>
      {!compact ? (
        <ol
          className="flex flex-wrap gap-6 pt-2"
          style={{ gap: wizard.stepGap }}
          aria-label={locale === "zh" ? "Campaign 向导步骤" : "Campaign wizard steps"}
        >
          {CAMPAIGN_WIZARD_STEPS.map((step) => {
            const isCurrent = step.id === current;
            const isDone = done.has(step.id);
            return (
              <li key={step.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-transform duration-micro",
                    isDone
                      ? "border-success bg-success text-success-foreground"
                      : isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                  )}
                  style={{ width: wizard.stepCircle, height: wizard.stepCircle }}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:inline",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label[locale]}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
