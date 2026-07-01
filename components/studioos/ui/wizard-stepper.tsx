"use client";

import type { Locale } from "@/lib/i18n";
import {
  BRAND_WIZARD_VISIBLE_STEP_COUNT,
  BRAND_WIZARD_VISIBLE_STEPS,
  CAMPAIGN_WIZARD_STEP_COUNT,
  CAMPAIGN_WIZARD_STEPS,
  brandWizardProgressPercent,
  clampWizardStep,
  completedBrandVisibleSteps,
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
  /** Brand ad wizard shows 3 user-facing steps instead of 7 internal steps */
  variant?: "full" | "brand";
};

export function WizardStepper({
  locale,
  currentStep,
  completedSteps,
  className,
  compact = false,
  variant = "full"
}: WizardStepperProps) {
  const isBrand = variant === "brand";
  const stepCount = isBrand ? BRAND_WIZARD_VISIBLE_STEP_COUNT : CAMPAIGN_WIZARD_STEP_COUNT;
  const steps = isBrand ? BRAND_WIZARD_VISIBLE_STEPS : CAMPAIGN_WIZARD_STEPS;
  const current = isBrand
    ? Math.min(BRAND_WIZARD_VISIBLE_STEP_COUNT, Math.max(1, Math.floor(currentStep) || 1))
    : clampWizardStep(currentStep);
  const done = new Set(
    completedSteps ?? (isBrand ? completedBrandVisibleSteps(current) : completedWizardSteps(current))
  );
  const percent = isBrand ? brandWizardProgressPercent(current) : wizardProgressPercent(current);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-caption">
        <span>
          {locale === "zh" ? "第" : "Step"} {current}{" "}
          {locale === "zh" ? "步，共" : "of"} {stepCount}{" "}
          {locale === "zh" ? "步" : "steps"}
        </span>
        <span>
          {percent}%
          {isBrand ? (locale === "zh" ? " 完成" : " complete") : ""}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-violet-100">
        <div
          className="h-full rounded-full bg-violet-600 transition-all duration-page"
          style={{ width: `${percent}%` }}
        />
      </div>
      {!compact ? (
        <ol
          className="flex flex-wrap gap-8 pt-2"
          style={{ gap: wizard.stepGap }}
          aria-label={locale === "zh" ? "Campaign 向导步骤" : "Campaign wizard steps"}
        >
          {steps.map((step) => {
            const isCurrent = step.id === current;
            const isDone = done.has(step.id);
            return (
              <li key={step.id} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-transform duration-micro",
                    isBrand && isDone
                      ? "border-violet-600 bg-violet-600 text-white"
                      : isBrand && isCurrent
                        ? "border-violet-600 bg-violet-600 text-white"
                        : isBrand
                          ? "border-zinc-200 bg-white text-zinc-400"
                          : isDone
                            ? "border-success bg-success text-success-foreground"
                            : isCurrent
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isBrand && isCurrent
                      ? "text-violet-700"
                      : isBrand
                        ? "text-zinc-400"
                        : isCurrent
                          ? "text-foreground"
                          : "text-muted-foreground"
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
