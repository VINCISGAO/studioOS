"use client";

import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowUpRight,
  CircleSlash2,
  Eraser,
  MousePointer2,
  PenLine,
  RotateCcw,
  Square,
  Trash2,
  Type
} from "lucide-react";
import {
  REVIEWER_FOCUS_STROKE_TOOLS,
  ReviewerFocusStrokeControls
} from "@/components/studioos/reviewer-skeleton/reviewer-focus-stroke-controls";
import { ReviewerStageLockedDialog } from "@/components/studioos/reviewer-skeleton/reviewer-stage-locked-dialog";
import type { ReviewerTool } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import type { Locale } from "@/lib/i18n";
import type { ReviewFocusTheme } from "@/lib/studioos/portal-focus-mode";
import { cn } from "@/lib/utils";

const DRAW_TOOLS: Array<{
  key: ReviewerTool;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: { zh: string; en: string };
}> = [
  { key: "select", icon: MousePointer2, label: { zh: "标注", en: "Annotate" } },
  { key: "arrow", icon: ArrowUpRight, label: { zh: "箭头", en: "Arrow" } },
  { key: "pen", icon: PenLine, label: { zh: "画笔", en: "Brush" } },
  { key: "rect", icon: Square, label: { zh: "矩形", en: "Rect" } },
  { key: "text", icon: Type, label: { zh: "文本", en: "Text" } },
  { key: "eraser", icon: Eraser, label: { zh: "橡皮擦", en: "Eraser" } }
];

export function ReviewerFocusToolbar({
  locale,
  theme = "dark",
  activeTool,
  canDraw,
  disabledMessage,
  penColor,
  penSize,
  onToolChange,
  onUndo,
  onClearAnnotations,
  onPenColorChange,
  onPenSizeChange,
  surface = "both"
}: {
  locale: Locale;
  theme?: ReviewFocusTheme;
  activeTool: ReviewerTool;
  canDraw: boolean;
  disabledMessage?: string;
  penColor: string;
  penSize: number;
  onToolChange: (tool: ReviewerTool) => void;
  onUndo: () => void;
  onClearAnnotations: () => void;
  onPenColorChange: (value: string) => void;
  onPenSizeChange: (value: number) => void;
  surface?: "sidebar" | "mobileDock" | "both";
}) {
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);
  const isDark = theme === "dark";
  const strokeControlsVisible = REVIEWER_FOCUS_STROKE_TOOLS.includes(
    activeTool as (typeof REVIEWER_FOCUS_STROKE_TOOLS)[number]
  );
  const showSidebar = surface === "sidebar" || surface === "both";
  const showMobileDock = surface === "mobileDock" || surface === "both";

  function showLockedDialog() {
    if (disabledMessage) setLockedDialogOpen(true);
  }

  function toolButton(item: (typeof DRAW_TOOLS)[number], compact = false) {
    const Icon = item.icon;
    const active = activeTool === item.key;
    const label = locale === "zh" ? item.label.zh : item.label.en;
    const disabled = !canDraw && item.key !== "select";

    return (
      <button
        key={item.key}
        type="button"
        aria-label={label}
        title={disabled && disabledMessage ? disabledMessage : label}
        onClick={() => {
          if (disabled) {
            showLockedDialog();
            return;
          }
          onToolChange(item.key);
        }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl transition",
          compact ? "h-10 w-10" : "w-[52px] flex-col gap-1 py-2",
          active
            ? isDark
              ? "bg-violet-500/20 text-violet-300"
              : "bg-violet-100 text-violet-600"
            : isDark
              ? "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
              : "text-zinc-500 hover:bg-white/80 hover:text-zinc-800",
          disabled ? "cursor-not-allowed opacity-35" : ""
        )}
      >
        <Icon className={cn("h-5 w-5", compact ? "" : "")} strokeWidth={active ? 2.1 : 1.8} />
        {!compact ? (
          <span
            className={cn(
              "text-[10px] font-medium leading-none",
              active ? (isDark ? "text-violet-300" : "text-violet-600") : isDark ? "text-zinc-500" : "text-zinc-500"
            )}
          >
            {label}
          </span>
        ) : null}
      </button>
    );
  }

  function actionButton({
    icon: Icon,
    label,
    onClick,
    compact = false
  }: {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    label: string;
    onClick: () => void;
    compact?: boolean;
  }) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => {
          if (!canDraw) {
            showLockedDialog();
            return;
          }
          onClick();
        }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl transition",
          compact ? "h-10 w-10" : "w-[52px] flex-col gap-1 py-2",
          isDark
            ? "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
            : "text-zinc-500 hover:bg-white/80 hover:text-zinc-800",
          !canDraw ? "cursor-not-allowed opacity-35" : ""
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
        {!compact ? (
          <span className="text-[10px] font-medium leading-none text-zinc-500">{label}</span>
        ) : null}
      </button>
    );
  }

  const strokeControlsSidebar = strokeControlsVisible ? (
    <ReviewerFocusStrokeControls
      locale={locale}
      penColor={penColor}
      penSize={penSize}
      onPenColorChange={onPenColorChange}
      onPenSizeChange={onPenSizeChange}
      layout="sidebar"
      theme={theme}
    />
  ) : null;

  return (
    <>
      {showSidebar ? (
        <aside
          className={cn(
            "hidden shrink-0 self-start rounded-2xl border px-1 py-2.5 md:flex md:flex-col md:items-center",
            isDark
              ? "border-zinc-700 bg-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
              : "border-zinc-200/90 bg-[#f5f5f7] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          )}
        >
          {disabledMessage ? (
            <>
              <button
                type="button"
                title={disabledMessage}
                aria-label={disabledMessage}
                onClick={showLockedDialog}
                className={cn(
                  "mb-1 flex h-9 w-9 items-center justify-center rounded-full border",
                  isDark
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-amber-200 bg-amber-50 text-amber-600"
                )}
              >
                <CircleSlash2 className="h-4 w-4" strokeWidth={2.2} />
              </button>
              <div className={cn("mb-1 h-px w-10", isDark ? "bg-zinc-700" : "bg-zinc-200")} />
            </>
          ) : null}
          <div className="flex flex-col gap-0.5">{DRAW_TOOLS.map((item) => toolButton(item))}</div>
          <div className={cn("my-2 h-px w-10", isDark ? "bg-zinc-700" : "bg-zinc-200")} />
          <div className="flex flex-col gap-0.5">
            {actionButton({ icon: RotateCcw, label: locale === "zh" ? "撤销" : "Undo", onClick: onUndo })}
            {actionButton({
              icon: Trash2,
              label: locale === "zh" ? "清空" : "Clear",
              onClick: onClearAnnotations
            })}
          </div>
          {strokeControlsSidebar ? (
            <>
              <div className={cn("my-2 h-px w-10", isDark ? "bg-zinc-700" : "bg-zinc-200")} />
              {strokeControlsSidebar}
            </>
          ) : null}
        </aside>
      ) : null}

      {showMobileDock ? (
        <div
          className={cn(
            "shrink-0 px-2 py-1.5 md:hidden",
            isDark ? "bg-zinc-950/95" : "bg-white/95"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {disabledMessage ? (
                <button
                  type="button"
                  title={disabledMessage}
                  aria-label={disabledMessage}
                  onClick={showLockedDialog}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                    isDark
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-amber-200 bg-amber-50 text-amber-600"
                  )}
                >
                  <CircleSlash2 className="h-5 w-5" strokeWidth={2.2} />
                </button>
              ) : null}
              {DRAW_TOOLS.map((item) => toolButton(item, true))}
              {actionButton({
                icon: RotateCcw,
                label: locale === "zh" ? "撤销" : "Undo",
                onClick: onUndo,
                compact: true
              })}
              {actionButton({
                icon: Trash2,
                label: locale === "zh" ? "清空" : "Clear",
                onClick: onClearAnnotations,
                compact: true
              })}
            </div>
            {strokeControlsVisible ? (
              <ReviewerFocusStrokeControls
                locale={locale}
                penColor={penColor}
                penSize={penSize}
                onPenColorChange={onPenColorChange}
                onPenSizeChange={onPenSizeChange}
                layout="dock"
                theme={theme}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <ReviewerStageLockedDialog
        locale={locale}
        kind="tool"
        message={disabledMessage}
        open={lockedDialogOpen}
        onOpenChange={setLockedDialogOpen}
      />
    </>
  );
}
