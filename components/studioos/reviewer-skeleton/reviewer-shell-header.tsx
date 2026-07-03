"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import type { ReactNode } from "react";
import { ReviewerShellPortalActions } from "@/components/studioos/reviewer-skeleton/reviewer-shell-portal-actions";
import type { Locale } from "@/lib/i18n";
import type { ReviewerShellHeaderInfo } from "@/components/studioos/reviewer-skeleton/reviewer-shell-types";
import type { ReviewerSkeletonMock } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-mock";
import { cn } from "@/lib/utils";

const focusToggleClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100 hover:text-violet-900";

const copy = {
  zh: {
    back: "返回项目",
    enterFocus: "进入专注模式",
    exitFocus: "退出专注模式",
    version: "版本"
  },
  en: {
    back: "Back to project",
    enterFocus: "Enter focus mode",
    exitFocus: "Exit focus mode",
    version: "Version"
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
  activeVersion,
  versions = [],
  onSelectVersion,
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
  activeVersion?: number;
  versions?: Array<{ version: number }>;
  onSelectVersion?: (version: number) => void;
  errorMessage?: string | null;
  onDismissError?: () => void;
  trailingActions?: ReactNode;
}) {
  const t = copy[locale];
  const showExitFocus = focusMode && onExitFocusMode;
  const showEnterFocus = !focusMode && onEnterFocusMode;

  return (
    <header className="border-b border-zinc-200/80 bg-white">
      <div className="flex min-h-[52px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 lg:px-6">
        {showExitFocus ? (
          <button type="button" onClick={onExitFocusMode} className={focusToggleClass}>
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>{t.exitFocus}</span>
          </button>
        ) : showEnterFocus ? (
          <button type="button" onClick={onEnterFocusMode} className={focusToggleClass}>
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t.enterFocus}</span>
            <span className="sm:hidden">{locale === "zh" ? "专注" : "Focus"}</span>
          </button>
        ) : (
          <Link
            href={backHref}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="max-w-[7rem] truncate sm:max-w-none">{backLabel ?? t.back}</span>
          </Link>
        )}

        <div className="hidden h-4 w-px bg-zinc-200 sm:block" aria-hidden />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="truncate text-sm font-semibold text-zinc-950 sm:text-base">{info.campaignTitle}</h1>
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            {info.statusLabel}
          </span>
          <span className="hidden text-[11px] text-zinc-400 md:inline">·</span>
          <span className="hidden truncate text-[11px] text-zinc-500 md:inline">{info.orderId}</span>
          {info.createdAtLabel ? (
            <>
              <span className="hidden text-[11px] text-zinc-400 lg:inline">·</span>
              <span className="hidden text-[11px] text-zinc-500 lg:inline">{info.createdAtLabel}</span>
            </>
          ) : null}
          {activeVersion != null ? (
            versions.length > 1 && onSelectVersion ? (
              <label className="relative inline-flex shrink-0 items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] text-zinc-600">
                <select
                  value={activeVersion}
                  className="cursor-pointer appearance-none bg-transparent pr-4 font-medium outline-none"
                  onChange={(event) => onSelectVersion(Number(event.target.value))}
                >
                  {versions.map((item) => (
                    <option key={item.version} value={item.version}>
                      V{item.version}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 h-3 w-3 text-zinc-400" />
              </label>
            ) : (
              <span className="shrink-0 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
                V{activeVersion}
              </span>
            )
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {trailingActions ?? <ReviewerShellPortalActions locale={locale} />}
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
      activeVersion={mock.versions.find((item) => item.active)?.version ?? mock.versions[0]?.version}
      versions={mock.versions}
    />
  );
}
