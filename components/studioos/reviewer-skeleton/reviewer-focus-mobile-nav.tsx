"use client";

import { MessageSquareText, MonitorPlay } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    review: "审片",
    comments: "批注"
  },
  en: {
    review: "Review",
    comments: "Notes"
  }
};

export type ReviewerFocusMobilePanel = "review" | "comments";

export function ReviewerFocusMobileNav({
  locale,
  panel,
  commentCount,
  onChange,
  theme = "light",
  className
}: {
  locale: Locale;
  panel: ReviewerFocusMobilePanel;
  commentCount: number;
  onChange: (panel: ReviewerFocusMobilePanel) => void;
  theme?: "light" | "dark";
  className?: string;
}) {
  const t = copy[locale];
  const isDark = theme === "dark";

  return (
    <nav
      className={cn(
        "flex shrink-0 border-t pb-[env(safe-area-inset-bottom)]",
        isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white",
        className
      )}
      aria-label={locale === "zh" ? "审片导航" : "Review navigation"}
    >
      {(
        [
          ["review", t.review, MonitorPlay],
          ["comments", t.comments, MessageSquareText]
        ] as const
      ).map(([key, label, Icon]) => {
        const active = panel === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
              active ? (isDark ? "text-violet-300" : "text-violet-700") : isDark ? "text-zinc-500" : "text-zinc-500"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? (isDark ? "text-violet-400" : "text-violet-600") : isDark ? "text-zinc-600" : "text-zinc-400")} />
            <span>{label}</span>
            {key === "comments" && commentCount > 0 ? (
              <span className="absolute right-[calc(50%-28px)] top-1.5 min-w-[18px] rounded-full bg-violet-600 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                {commentCount > 99 ? "99+" : commentCount}
              </span>
            ) : null}
            {active ? (
              <span
                className={cn(
                  "absolute inset-x-8 top-0 h-0.5 rounded-full",
                  isDark ? "bg-violet-400" : "bg-violet-600"
                )}
              />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
