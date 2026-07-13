"use client";

import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";
import type { Locale } from "@/lib/i18n";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickBriefAiReview({
  locale,
  isAnalyzing,
  onBack,
  onContinue,
  isPending,
  showFooter = true,
  children
}: {
  locale: Locale;
  isAnalyzing: boolean;
  onBack: () => void;
  onContinue: () => void;
  isPending: boolean;
  showFooter?: boolean;
  children?: React.ReactNode;
}) {
  const t = quickBriefCopy(locale);

  return (
    <div className="w-full space-y-6 pb-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isAnalyzing ? t.aiWorking : locale === "zh" ? "AI 分析完成" : "AI analysis complete"}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{t.budgetReviewTitle}</h1>
        <p className="text-sm leading-6 text-zinc-500">{t.budgetReviewSubtitle}</p>
      </header>

      {isAnalyzing ? (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <span>{t.aiWorking}</span>
          </div>
        </div>
      ) : (
        children
      )}

      {showFooter ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onBack} disabled={isPending}>
              {t.back}
            </Button>
            <Button
              type="button"
              className="h-12 rounded-xl bg-violet-600 px-8 font-semibold hover:bg-violet-700"
              disabled={isAnalyzing || isPending}
              onClick={onContinue}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {locale === "zh" ? "确认并继续" : "Confirm & continue"}
              {!isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
          </div>
      ) : null}
    </div>
  );
}
