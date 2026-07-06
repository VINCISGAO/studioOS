"use client";

import Link from "next/link";
import { ArrowLeft, Maximize2, X } from "lucide-react";
import type { ReactNode } from "react";
import { ReviewerShellPortalActions } from "@/components/studioos/reviewer-skeleton/reviewer-shell-portal-actions";
import type { Locale } from "@/lib/i18n";
import type { ReviewerShellHeaderInfo } from "@/components/studioos/reviewer-skeleton/reviewer-shell-types";
import type { ReviewerSkeletonMock } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-mock";

const focusToggleClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100 hover:text-violet-900";

const copy = {
  zh: {
    back: "返回上一步",
    enterFocus: "进入专注模式",
    exitFocus: "退出专注模式"
  },
  en: {
    back: "Back",
    enterFocus: "Enter focus mode",
    exitFocus: "Exit focus mode"
  }
};

export function ReviewerShellHeader({
  locale,
  backHref,
  backLabel,
  focusMode = false,
  onExitFocusMode,
  onEnterFocusMode,
  info,
  errorMessage,
  onDismissError,
  trailingActions
}: {
  locale: Locale;
  backHref: string;
  backLabel?: string;
  focusMode?: boolean;
  onExitFocusMode?: () => void;
  onEnterFocusMode?: () => void;
  info: ReviewerShellHeaderInfo;
  errorMessage?: string | null;
  onDismissError?: () => void;
  trailingActions?: ReactNode;
}) {
  const t = copy[locale];
  const showExitFocus = focusMode && onExitFocusMode;
  const showEnterFocus = !focusMode && onEnterFocusMode;
  const navigationControls = showExitFocus ? (
    <button type="button" onClick={onExitFocusMode} className={focusToggleClass}>
      <ArrowLeft className="h-4 w-4 shrink-0" />
      <span>{t.exitFocus}</span>
    </button>
  ) : (
    <>
      <Link
        href={backHref}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span className="max-w-[7rem] truncate sm:max-w-none">{backLabel ?? t.back}</span>
      </Link>
      {showEnterFocus ? (
        <button type="button" onClick={onEnterFocusMode} className={focusToggleClass}>
          <Maximize2 className="h-4 w-4 shrink-0" />
          <span>{t.enterFocus}</span>
        </button>
      ) : null}
    </>
  );

  return (
    <header className="border-b border-zinc-200/80 bg-white">
      <div className="px-4 py-3 lg:px-6">
        <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1.5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="truncate text-sm font-semibold text-zinc-950 sm:text-base">{info.campaignTitle}</h1>
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              {info.statusLabel}
            </span>
            {info.createdAtLabel ? (
              <>
                <span className="hidden text-[11px] text-zinc-400 lg:inline">·</span>
                <span className="hidden text-[11px] text-zinc-500 lg:inline">{info.createdAtLabel}</span>
              </>
            ) : null}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {trailingActions ?? <ReviewerShellPortalActions locale={locale} />}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
          {navigationControls}
        </div>
      </div>

      {errorMessage ? (
        <div className="flex items-center justify-between gap-3 border-t border-red-100 bg-red-50 px-4 py-1.5 lg:px-6">
          <p className="truncate text-xs text-red-700">{errorMessage}</p>
          {onDismissError ? (
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-red-500 hover:bg-red-100"
              aria-label={locale === "zh" ? "关闭" : "Dismiss"}
              onClick={onDismissError}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

export function ReviewerSkeletonHeader({
  locale,
  backHref,
  backLabel,
  mock
}: {
  locale: Locale;
  backHref: string;
  backLabel?: string;
  mock: ReviewerSkeletonMock;
}) {
  return (
    <ReviewerShellHeader
      locale={locale}
      backHref={backHref}
      backLabel={backLabel}
      info={{
        campaignTitle: mock.campaignTitle,
        orderId: mock.orderId,
        createdAtLabel: mock.createdAtLabel,
        statusLabel: mock.statusLabel
      }}
    />
  );
}
