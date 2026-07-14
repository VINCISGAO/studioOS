"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { Sparkles } from "lucide-react";

const STAGES = {
  zh: ["读取来源", "识别画面", "拆解镜头", "生成大纲"],
  en: ["Reading source", "Detecting visuals", "Breaking down shots", "Building outline"]
} as const;

export function ReferenceAnalysisProgress({
  locale,
  status = "analyzing"
}: {
  locale: Locale;
  status?: "pending" | "analyzing";
}) {
  const stages = STAGES[locale];
  const [progress, setProgress] = useState(status === "pending" ? 4 : 8);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const cap = status === "pending" ? 28 : 92;
      const base = status === "pending" ? 4 : 8;
      const next = Math.min(cap, base + (1 - Math.exp(-elapsed / 5200)) * (cap - base));
      setProgress(next);
      setStageIndex(Math.min(stages.length - 1, Math.floor(elapsed / 2400)));
    }, 70);

    return () => window.clearInterval(timer);
  }, [stages.length, status]);

  const percent = Math.round(progress);
  const label = stages[stageIndex] ?? stages[0];

  return (
    <div className="mt-3" role="status" aria-live="polite" aria-busy="true">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse text-violet-600" aria-hidden />
          <p className="truncate text-xs font-medium text-violet-800">{label}</p>
        </div>
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-violet-600">{percent}%</span>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-violet-100/90">
        <div
          className="relative z-10 h-full rounded-full bg-gradient-to-r from-violet-400 via-violet-600 to-indigo-500 transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[28%] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
          style={{ animation: "quickBriefPolishSweep 1.6s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
