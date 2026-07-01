"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { approveDeliveryAction, requestRevisionAction } from "@/app/order-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function DecisionSubmitButton({
  variant,
  className,
  children
}: {
  variant?: "outline" | "default";
  className?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}

export function ReviewDeliveryDecisionForms({
  locale,
  orderId,
  projectId,
  requestChangesLabel,
  approveLabel,
  className
}: {
  locale: Locale;
  orderId: string;
  projectId?: string | null;
  requestChangesLabel: string;
  approveLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto", className)}>
      <form action={requestRevisionAction}>
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="order_id" value={orderId} />
        {projectId ? <input type="hidden" name="project_id" value={projectId} /> : null}
        <DecisionSubmitButton variant="outline">
          <RotateCcw className="h-4 w-4" />
          {requestChangesLabel}
        </DecisionSubmitButton>
      </form>
      <form action={approveDeliveryAction}>
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="order_id" value={orderId} />
        {projectId ? <input type="hidden" name="project_id" value={projectId} /> : null}
        <DecisionSubmitButton className="bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {approveLabel}
        </DecisionSubmitButton>
      </form>
    </div>
  );
}
