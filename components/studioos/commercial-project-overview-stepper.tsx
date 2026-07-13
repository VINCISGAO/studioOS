"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type CommercialOverviewStep = {
  label: string;
  subtitle: string;
};

export function CommercialProjectOverviewStepper({
  steps,
  currentIndex
}: {
  steps: CommercialOverviewStep[];
  currentIndex: number;
}) {
  const activeStep = steps[currentIndex];
  const trackProgress = steps.length > 1 ? currentIndex / (steps.length - 1) : 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="relative px-1 sm:px-0">
          <div
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-3.5 hidden h-0.5 bg-zinc-200 sm:block"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-[12.5%] top-3.5 hidden h-0.5 bg-violet-400 transition-all duration-300 sm:block"
            style={{ width: `calc(75% * ${trackProgress})` }}
            aria-hidden
          />

          <ol className="relative grid grid-cols-4 gap-1 sm:gap-4">
            {steps.map((step, index) => {
              const done = index < currentIndex;
              const active = index === currentIndex;
              return (
                <li key={`${step.label}-${index}`} className="relative min-w-0">
                  {index < steps.length - 1 ? (
                    <span
                      className={cn(
                        "absolute left-[calc(50%+14px)] top-3.5 block h-0.5 w-[calc(100%-28px)] sm:hidden",
                        done ? "bg-violet-400" : "bg-zinc-200"
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <div className="flex flex-col items-center text-center">
                    <span
                      className={cn(
                        "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold sm:h-8 sm:w-8 sm:text-xs",
                        done || active
                          ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                          : "border border-zinc-200 bg-white text-zinc-400"
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : index + 1}
                    </span>
                    <p
                      className={cn(
                        "mt-1.5 line-clamp-2 text-[10px] font-semibold leading-tight sm:mt-2 sm:text-sm",
                        active ? "text-violet-700" : done ? "text-zinc-800" : "text-zinc-400"
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 hidden text-xs leading-relaxed sm:block",
                        active ? "text-violet-600/90" : "text-zinc-400"
                      )}
                    >
                      {step.subtitle}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {activeStep ? (
          <p className="mt-3 rounded-xl bg-violet-50/80 px-3 py-2 text-center text-xs leading-relaxed text-violet-700 sm:hidden">
            {activeStep.subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}
