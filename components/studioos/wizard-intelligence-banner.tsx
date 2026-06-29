"use client";

import { Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { WizardIntelligencePrefill } from "@/lib/studioos/creative-performance-types";

type Props = {
  locale: Locale;
  prefill: WizardIntelligencePrefill;
  step: number;
};

export function WizardIntelligenceBanner({ locale, prefill, step }: Props) {
  if (prefill.source === "none" || (step !== 3 && step !== 4)) {
    return null;
  }

  const top = prefill.insights[0];
  const styles = prefill.style_presets.join(", ");
  const lengths = prefill.video_lengths.join(", ");

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4">
      <div className="flex gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" />
        <div className="space-y-2 text-sm">
          <p className="font-medium text-zinc-950">
            {locale === "zh" ? "Creative Intelligence 预填" : "Creative Intelligence prefill"}
          </p>
          <p className="leading-6 text-zinc-600">
            {locale === "zh"
              ? `基于 ${prefill.dna_version} 条归因记录 — 风格 ${styles} · 时长 ${lengths} · Hook ${prefill.hook_style}`
              : `From ${prefill.dna_version} attributed record(s) — ${styles} · ${lengths} · hook ${prefill.hook_style}`}
          </p>
          {top ? (
            <p className="text-zinc-500">{top.title[locale]} — {top.body[locale]}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
