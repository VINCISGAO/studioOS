"use client";

import { Moon, MoreHorizontal, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { ReviewFocusTheme } from "@/lib/studioos/portal-focus-mode";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    exit: "退出专注模式",
    lightTheme: "白色",
    darkTheme: "黑色"
  },
  en: {
    exit: "Exit focus mode",
    lightTheme: "Light",
    darkTheme: "Dark"
  }
};

function ThemeToggle({
  locale,
  theme,
  isDark,
  onThemeChange,
  compact = false
}: {
  locale: Locale;
  theme: ReviewFocusTheme;
  isDark: boolean;
  onThemeChange: (theme: ReviewFocusTheme) => void;
  compact?: boolean;
}) {
  const t = copy[locale];

  return (
    <div
      className={cn(
        "inline-flex rounded-xl border p-1 shadow-sm",
        compact ? "gap-0.5" : "",
        isDark ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-zinc-100"
      )}
    >
      <button
        type="button"
        aria-label={t.lightTheme}
        onClick={() => onThemeChange("light")}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition",
          compact ? "h-8 w-8" : "min-w-[88px] gap-1.5 px-4 py-2 text-sm font-semibold",
          theme === "light"
            ? isDark
              ? "bg-zinc-800 text-violet-300 shadow-sm"
              : "bg-white text-violet-600 shadow-sm"
            : isDark
              ? "text-zinc-500 hover:text-zinc-300"
              : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        <Sun className="h-4 w-4" />
        {!compact ? t.lightTheme : null}
      </button>
      <button
        type="button"
        aria-label={t.darkTheme}
        onClick={() => onThemeChange("dark")}
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition",
          compact ? "h-8 w-8" : "min-w-[88px] gap-1.5 px-4 py-2 text-sm font-semibold",
          theme === "dark"
            ? isDark
              ? "bg-zinc-800 text-violet-300 shadow-sm"
              : "bg-white text-violet-600 shadow-sm"
            : isDark
              ? "text-zinc-500 hover:text-zinc-300"
              : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        <Moon className="h-4 w-4" />
        {!compact ? t.darkTheme : null}
      </button>
    </div>
  );
}

export function ReviewerFocusHeader({
  locale,
  theme,
  onThemeChange,
  onExit,
  errorMessage,
  onDismissError
}: {
  locale: Locale;
  theme: ReviewFocusTheme;
  onThemeChange: (theme: ReviewFocusTheme) => void;
  onExit: () => void;
  errorMessage?: string | null;
  onDismissError?: () => void;
}) {
  const t = copy[locale];
  const isDark = theme === "dark";

  return (
    <header
      className={cn(
        "shrink-0 border-b",
        isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"
      )}
    >
      <div className="flex min-h-[44px] items-center gap-2 px-3 py-1.5 sm:min-h-[52px] sm:px-5 sm:py-2">
        <button
          type="button"
          onClick={onExit}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition sm:gap-2 sm:px-3",
            isDark
              ? "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          )}
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">{t.exit}</span>
          <span className="sm:hidden">{locale === "zh" ? "退出" : "Exit"}</span>
        </button>

        <div className="hidden flex-1 justify-center sm:flex">
          <ThemeToggle
            locale={locale}
            theme={theme}
            isDark={isDark}
            onThemeChange={onThemeChange}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <div className="sm:hidden">
            <ThemeToggle
              locale={locale}
              theme={theme}
              isDark={isDark}
              onThemeChange={onThemeChange}
              compact
            />
          </div>
          <Button
            size="icon"
            variant="outline"
            disabled
            className={cn(
              "h-8 w-8 rounded-lg",
              isDark ? "border-zinc-700 bg-zinc-900 text-zinc-400" : "border-zinc-200 bg-white text-zinc-500"
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-t px-3 py-2 sm:px-5",
            isDark ? "border-red-900/50 bg-red-950/40" : "border-red-100 bg-red-50"
          )}
        >
          <p className={cn("truncate text-xs", isDark ? "text-red-300" : "text-red-700")}>{errorMessage}</p>
          {onDismissError ? (
            <button
              type="button"
              className={cn("text-xs font-medium", isDark ? "text-red-400" : "text-red-600")}
              onClick={onDismissError}
            >
              {locale === "zh" ? "关闭" : "Dismiss"}
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
