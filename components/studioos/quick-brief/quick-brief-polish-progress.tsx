"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { quickBriefCopy } from "@/lib/studioos/quick-brief-copy";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles } from "lucide-react";

export function QuickBriefPolishProgress({
  locale,
  active
}: {
  locale: Locale;
  active: boolean;
}) {
  const t = quickBriefCopy(locale);
  const stages = t.aiPolishStages;
  const wasActiveRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (active) {
      wasActiveRef.current = true;
      setVisible(true);
      setCompleted(false);
      setProgress(6);
      setStageIndex(0);

      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const next = Math.min(94, 6 + (1 - Math.exp(-elapsed / 4800)) * 88);
        setProgress(next);
        setStageIndex(Math.min(stages.length - 1, Math.floor(elapsed / 2100)));
      }, 70);

      return () => window.clearInterval(timer);
    }

    if (!wasActiveRef.current) {
      return;
    }

    wasActiveRef.current = false;
    setCompleted(true);
    setProgress(100);
    setStageIndex(stages.length - 1);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      setCompleted(false);
      setProgress(0);
      setStageIndex(0);
    }, 650);

    return () => window.clearTimeout(hideTimer);
  }, [active, stages.length]);

  if (!visible) {
    return null;
  }

  const label = completed ? t.aiPolishComplete : (stages[stageIndex] ?? t.aiPolishing);
  const percent = Math.round(progress);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!completed}
      className={cn(
        "w-full overflow-hidden rounded-xl border border-violet-200/90",
        "bg-gradient-to-br from-violet-50/95 via-white to-indigo-50/80",
        "p-4 shadow-[0_6px_28px_rgba(124,58,237,0.1)] transition-all duration-300",
        completed ? "border-emerald-200/90 from-emerald-50/70 to-white" : ""
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {completed ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-violet-600" aria-hidden />
          )}
          <p
            className={cn(
              "truncate text-sm font-medium",
              completed ? "text-emerald-800" : "text-violet-900"
            )}
          >
            {label}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-xs font-semibold tabular-nums",
            completed ? "text-emerald-600" : "text-violet-600"
          )}
        >
          {percent}%
        </span>
      </div>

      <div className="relative h-2.5 overflow-hidden rounded-full bg-violet-100/90">
        <div
          className={cn(
            "relative z-10 h-full rounded-full transition-[width] duration-300 ease-out",
            completed
              ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-violet-400 via-violet-600 to-indigo-500"
          )}
          style={{ width: `${percent}%` }}
        />
        {!completed ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[28%] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
            style={{ animation: "quickBriefPolishSweep 1.6s ease-in-out infinite" }}
          />
        ) : null}
      </div>

      {!completed ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {stages.map((stage, index) => (
            <span
              key={stage}
              title={stage}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                index <= stageIndex
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-violet-100/80 text-violet-500"
              )}
            >
              {index + 1}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
