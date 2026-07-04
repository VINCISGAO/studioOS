"use client";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";

const copy = {
  en: { back: "Back to previous step", saveDraft: "Save draft", confirm: "Choose and freeze Production Brief" },
  zh: { back: "返回上一步", saveDraft: "保存草稿", confirm: "选择并冻结 Production Brief" }
} as const;

export function BrandCampaignStep2Footer({
  locale,
  isPending,
  loadingDirections,
  selectedId,
  isSavingDraft,
  onBack,
  onSaveDraft,
  onConfirm
}: {
  locale: Locale;
  isPending: boolean;
  loadingDirections: boolean;
  selectedId: string | null;
  isSavingDraft?: boolean;
  onBack: () => void;
  onSaveDraft?: () => void;
  onConfirm: () => void;
}) {
  const t = copy[locale];

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl border-zinc-200 bg-white"
          onClick={onBack}
          disabled={isPending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {onSaveDraft ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-zinc-200 bg-white"
              disabled={isPending || isSavingDraft}
              onClick={onSaveDraft}
            >
              {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t.saveDraft}
            </Button>
          ) : null}
          <Button
            type="button"
            className="h-11 rounded-xl bg-violet-600 px-8 hover:bg-violet-700 disabled:opacity-50"
            disabled={isPending || loadingDirections || !selectedId}
            onClick={onConfirm}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t.confirm}
            {!isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
    </div>
  );
}
