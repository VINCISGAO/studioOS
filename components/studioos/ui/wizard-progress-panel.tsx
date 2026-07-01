"use client";

import type { Locale } from "@/lib/i18n";
import type { WizardDraftState } from "@/lib/campaign/wizard-steps";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type WizardProgressPanelProps = {
  locale: Locale;
  draft: WizardDraftState | null;
  fallbackMessage?: string;
  className?: string;
};

export function WizardProgressPanel({
  locale,
  draft,
  fallbackMessage,
  className
}: WizardProgressPanelProps) {
  const active = draft?.phase === "analyzing" || draft?.phase === "matching" || draft?.phase === "publishing";
  const message =
    draft?.progressMessage ??
    fallbackMessage ??
    (locale === "zh" ? "处理中…" : "Working…");
  const percent = draft?.progressPercent ?? (active ? 30 : 0);

  if (!active && !fallbackMessage) return null;

  return (
    <div
      className={cn(
        "rounded-card border border-border/80 bg-card p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {active ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{message}</p>
          {active ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-page"
                style={{ width: `${Math.min(100, percent)}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
