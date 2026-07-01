import type { Locale } from "@/lib/i18n";
import { reviewCenterActiveStepIndex, reviewCenterWorkflowSteps } from "@/lib/studioos/review-center-workflow";
import type { StoredOrder } from "@/lib/order-types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function ReviewCenterStepper({
  locale,
  order,
  deliverableCount
}: {
  locale: Locale;
  order: StoredOrder;
  deliverableCount: number;
}) {
  const steps = reviewCenterWorkflowSteps[locale];
  const activeIndex = reviewCenterActiveStepIndex(order, deliverableCount);

  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
      {steps.map((label, index) => {
        const done = index < activeIndex;
        const current = index === activeIndex;
        return (
          <li key={label} className="flex min-w-0 items-center">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  done
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "border border-zinc-200 bg-white text-zinc-400"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden truncate text-xs font-medium sm:inline",
                  current ? "text-blue-700" : done ? "text-zinc-700" : "text-zinc-400"
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span className="mx-2 hidden h-px w-6 bg-zinc-200 sm:block lg:w-10" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
