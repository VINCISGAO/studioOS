"use client";

import { Info } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { settlementUsdNote } from "@/lib/money/display-money";
import { cn } from "@/lib/utils";

export function BudgetSettlementCallout({
  message,
  className
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2.5 shadow-sm",
        className
      )}
      role="note"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <p className="text-xs font-semibold leading-5 text-amber-950 sm:text-sm">{message}</p>
    </div>
  );
}

export function SettlementUsdCallout({
  locale,
  className
}: {
  locale: Locale;
  className?: string;
}) {
  const message = settlementUsdNote(locale);
  if (!message) return null;
  return <BudgetSettlementCallout message={message} className={className} />;
}
