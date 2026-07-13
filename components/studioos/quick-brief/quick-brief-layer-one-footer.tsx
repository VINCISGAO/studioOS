"use client";

import { PortalFixedFooter } from "@/components/studioos/portal/portal-fixed-footer";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";
import { ArrowRight, Loader2 } from "lucide-react";

export function QuickBriefLayerOneFooter({
  locale,
  isPending,
  onSaveDraft,
  onNext
}: {
  locale: Locale;
  isPending: boolean;
  onSaveDraft?: () => void;
  onNext: () => void;
}) {
  const t = quickBriefCopy(locale);

  return (
    <PortalFixedFooter
      zIndex="z-40"
      innerClassName="flex w-full flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4 lg:px-8"
    >
      <div className="hidden min-h-5 flex-1 sm:block" />
      <div className="flex w-full shrink-0 flex-row gap-2 sm:w-auto">
        {onSaveDraft ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl sm:h-12 sm:flex-none"
            onClick={onSaveDraft}
            disabled={isPending}
          >
            {t.saveDraft}
          </Button>
        ) : null}
        <Button
          type="button"
          className="h-11 flex-1 rounded-xl bg-zinc-950 px-6 text-base font-semibold hover:bg-black sm:h-12 sm:flex-none sm:px-8"
          disabled={isPending}
          onClick={onNext}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t.next}
          {!isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </Button>
      </div>
    </PortalFixedFooter>
  );
}
