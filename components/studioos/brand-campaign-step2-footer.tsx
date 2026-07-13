"use client";

import type { Locale } from "@/lib/i18n";
import { PortalFixedFooter } from "@/components/studioos/portal/portal-fixed-footer";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";

const copy = {
  en: {
    back: "Back to previous step",
    saveDraft: "Save draft",
    confirm: "Confirm plan",
    confirming: "Confirming…"
  },
  zh: {
    back: "返回上一步",
    saveDraft: "保存草稿",
    confirm: "确认方案",
    confirming: "正在确认…"
  }
} as const;

export function BrandCampaignStep2Footer({
  locale,
  directionsReady,
  selectedId,
  isConfirming = false,
  confirmLabel,
  confirmingLabel,
  onBack,
  onSaveDraft,
  onConfirm
}: {
  locale: Locale;
  directionsReady: boolean;
  selectedId: string | null;
  isConfirming?: boolean;
  confirmLabel?: string;
  confirmingLabel?: string;
  onBack: () => void;
  onSaveDraft?: () => void;
  onConfirm: () => void;
}) {
  const t = copy[locale];

  return (
    <PortalFixedFooter
      zIndex="z-40"
      innerClassName={cn(
        "flex min-h-14 flex-wrap items-center justify-between gap-3 py-2",
        "px-3 sm:px-4 lg:px-5",
        "pr-3 sm:pr-4 lg:pr-5"
      )}
    >
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">{t.back}</span>
        </button>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 max-[430px]:w-full max-[430px]:justify-end">
          {onSaveDraft ? (
            <button
              type="button"
              onClick={onSaveDraft}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 sm:h-10 sm:px-4"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{t.saveDraft}</span>
            </button>
          ) : null}
          <button
            type="button"
            disabled={!directionsReady || !selectedId || isConfirming}
            onClick={onConfirm}
            className="inline-flex h-9 max-w-[min(100vw-7rem,280px)] items-center justify-center gap-2 truncate rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:max-w-none sm:px-5"
          >
            {isConfirming ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
            <span className="truncate">
              {isConfirming ? confirmingLabel ?? t.confirming : confirmLabel ?? t.confirm}
            </span>
            {!isConfirming ? <ArrowRight className="h-4 w-4 shrink-0" /> : null}
          </button>
        </div>
    </PortalFixedFooter>
  );
}
