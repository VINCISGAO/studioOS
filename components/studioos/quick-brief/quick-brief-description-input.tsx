"use client";

import { useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { QuickBriefSectionCard } from "@/components/studioos/quick-brief/quick-brief-section-header";
import { QuickBriefPolishProgress } from "@/components/studioos/quick-brief/quick-brief-polish-progress";
import type { Locale } from "@/lib/i18n";
import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";
import { cn } from "@/lib/utils";
import { Info, Loader2, RefreshCw, Sparkles } from "lucide-react";

export const QUICK_BRIEF_DESCRIPTION_MAX = 800;

export function QuickBriefDescriptionInput({
  locale,
  value,
  onChange,
  disabled,
  polishDisabled,
  onPolish,
  isPolishing,
  polishNotice
}: {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** When set, only the polish button respects this — not the textarea. */
  polishDisabled?: boolean;
  onPolish?: () => void | Promise<void>;
  isPolishing?: boolean;
  polishNotice?: string | null;
}) {
  const t = quickBriefCopy(locale);
  const [localPolishing, setLocalPolishing] = useState(false);
  const polishClickLockRef = useRef(false);
  const polishing = Boolean(isPolishing) || localPolishing;
  const [suggestionSetIndex, setSuggestionSetIndex] = useState(0);
  const suggestions = useMemo(() => {
    const sets = t.descriptionSuggestionSets;
    return sets[suggestionSetIndex % sets.length] ?? sets[0] ?? [];
  }, [suggestionSetIndex, t.descriptionSuggestionSets]);

  function handleSuggestionClick(text: string) {
    const trimmed = value.trim();
    const separator = locale === "zh" ? "，" : ", ";
    const next = trimmed ? `${trimmed}${separator}${text}` : text;
    onChange(next.slice(0, QUICK_BRIEF_DESCRIPTION_MAX));
  }

  function handlePolishClick() {
    if (!onPolish || polishing || polishDisabled || !value.trim() || polishClickLockRef.current) {
      return;
    }

    polishClickLockRef.current = true;
    setLocalPolishing(true);

    void Promise.resolve(onPolish())
      .catch(() => {
        // Parent surfaces errors via polishError.
      })
      .finally(() => {
        polishClickLockRef.current = false;
        setLocalPolishing(false);
      });
  }

  return (
    <QuickBriefSectionCard className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
            1
          </span>
          <p className="text-sm font-semibold text-zinc-900">
            {t.descriptionTitle}
            <span className="ml-0.5 text-red-500">*</span>
          </p>
        </div>
        <div className="flex items-center gap-1 pl-9 text-xs text-zinc-400 sm:pl-0">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>{t.descriptionHint}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-violet-300 bg-white shadow-sm">
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-violet-100 bg-violet-50/40 px-3 py-3">
          <p className="w-full text-xs font-medium text-zinc-500">{t.descriptionPromptLead}</p>
          {t.descriptionPromptTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-violet-100 bg-white px-3 py-1 text-xs font-semibold text-violet-700"
            >
              {tag}
            </span>
          ))}
        </div>
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, QUICK_BRIEF_DESCRIPTION_MAX))}
          disabled={disabled}
          className={cn(
            "min-h-[16rem] flex-1 resize-none rounded-none border-0 bg-transparent px-4 py-3.5 text-sm leading-relaxed text-zinc-800 shadow-none sm:min-h-0",
            "placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          placeholder={t.descriptionPlaceholder}
        />
      </div>

      <div className="mt-3 flex shrink-0 flex-wrap items-center gap-3">
        {onPolish ? (
          <Button
            type="button"
            variant="outline"
            aria-busy={polishing}
            className="h-10 min-w-[8.75rem] shrink-0 gap-2 whitespace-nowrap rounded-xl border-violet-200 bg-violet-50 px-5 text-sm font-semibold text-violet-700 shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800 disabled:opacity-50"
            disabled={polishDisabled || polishing || !value.trim()}
            onClick={handlePolishClick}
          >
            {polishing ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                <span>{t.aiPolishing}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t.aiPolish}</span>
              </>
            )}
          </Button>
        ) : null}
        {polishNotice && !polishing ? (
          <span className="text-xs font-medium text-emerald-600">{polishNotice}</span>
        ) : null}
        <span className="text-xs tabular-nums text-zinc-400">
          {value.length} / {QUICK_BRIEF_DESCRIPTION_MAX}
        </span>
      </div>

      <QuickBriefPolishProgress locale={locale} active={polishing} />

      <div className="mt-4 shrink-0 space-y-2.5">
        <p className="text-xs text-zinc-500">{t.suggestionLead}</p>
        <div className="flex flex-wrap items-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={disabled}
              onClick={() => handleSuggestionClick(suggestion)}
              className="max-w-full rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-600 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setSuggestionSetIndex((current) => current + 1)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t.refreshSuggestions}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </QuickBriefSectionCard>
  );
}
