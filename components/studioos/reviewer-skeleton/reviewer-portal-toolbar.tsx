"use client";

import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRight,
  Circle,
  Eraser,
  MousePointer2,
  PenLine,
  Square,
  Trash2,
  Type,
  Undo2
} from "lucide-react";
import { ReviewerStageLockedDialog } from "@/components/studioos/reviewer-skeleton/reviewer-stage-locked-dialog";
import type { ReviewerTool } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DRAW_TOOLS: Array<{
  key: ReviewerTool;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: { zh: string; en: string };
}> = [
  { key: "select", icon: MousePointer2, label: { zh: "选择", en: "Select" } },
  { key: "arrow", icon: ArrowRight, label: { zh: "箭头", en: "Arrow" } },
  { key: "pen", icon: PenLine, label: { zh: "画笔", en: "Pen" } },
  { key: "rect", icon: Square, label: { zh: "矩形", en: "Rect" } },
  { key: "circle", icon: Circle, label: { zh: "圆形", en: "Circle" } },
  { key: "text", icon: Type, label: { zh: "文本", en: "Text" } },
  { key: "eraser", icon: Eraser, label: { zh: "橡皮", en: "Eraser" } }
];

export function ReviewerPortalToolbar({
  locale,
  activeTool,
  canDraw,
  disabledMessage,
  layout = "horizontal",
  onToolChange,
  onUndo,
  onClearAnnotations
}: {
  locale: Locale;
  activeTool: ReviewerTool;
  canDraw: boolean;
  disabledMessage?: string;
  layout?: "horizontal" | "vertical";
  onToolChange: (tool: ReviewerTool) => void;
  onUndo: () => void;
  onClearAnnotations: () => void;
}) {
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);

  function showLocked() {
    if (disabledMessage) setLockedDialogOpen(true);
  }

  function renderVerticalTool(item: (typeof DRAW_TOOLS)[number]) {
    const Icon = item.icon;
    const active = activeTool === item.key;
    const disabled = !canDraw && item.key !== "select";
    const label = locale === "zh" ? item.label.zh : item.label.en;

    return (
      <button
        key={item.key}
        type="button"
        aria-label={label}
        title={disabled && disabledMessage ? disabledMessage : label}
        onClick={() => {
          if (disabled) {
            showLocked();
            return;
          }
          onToolChange(item.key);
        }}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg border transition",
          active
            ? "border-violet-300 bg-violet-50 text-violet-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700",
          disabled ? "cursor-not-allowed opacity-35" : ""
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={active ? 2.1 : 1.8} />
      </button>
    );
  }

  function renderHorizontalTool(item: (typeof DRAW_TOOLS)[number]) {
    const Icon = item.icon;
    const active = activeTool === item.key;
    const disabled = !canDraw && item.key !== "select";
    const label = locale === "zh" ? item.label.zh : item.label.en;

    return (
      <button
        key={item.key}
        type="button"
        aria-label={label}
        title={disabled && disabledMessage ? disabledMessage : label}
        onClick={() => {
          if (disabled) {
            showLocked();
            return;
          }
          onToolChange(item.key);
        }}
        className={cn(
          "flex min-w-[56px] flex-col items-center justify-center rounded-xl px-2 py-1.5 transition",
          active
            ? "bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-100"
            : "text-zinc-600 hover:bg-zinc-50",
          disabled ? "cursor-not-allowed opacity-35" : ""
        )}
      >
        <Icon className={cn("h-4 w-4", active ? "text-violet-700" : "text-zinc-600")} strokeWidth={1.9} />
        <span className={cn("mt-0.5 text-[10px] font-medium leading-none", active ? "text-violet-700" : "text-zinc-600")}>
          {label}
        </span>
      </button>
    );
  }

  const undoLabel = locale === "zh" ? "撤销" : "Undo";
  const clearLabel = locale === "zh" ? "清空" : "Clear";

  if (layout === "vertical") {
    return (
      <>
        <aside className="hidden shrink-0 flex-col gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm md:flex">
          {DRAW_TOOLS.map((item) => renderVerticalTool(item))}
          <button
            type="button"
            aria-label={undoLabel}
            title={undoLabel}
            onClick={() => {
              if (!canDraw) {
                showLocked();
                return;
              }
              onUndo();
            }}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700",
              !canDraw ? "cursor-not-allowed opacity-35" : ""
            )}
          >
            <Undo2 className="h-4 w-4" />
          </button>
        </aside>
        <div className="shrink-0 border-b border-zinc-100 bg-white py-2 md:hidden">
          <div className="flex gap-1 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {DRAW_TOOLS.map((item) => renderHorizontalTool(item))}
            <button
              type="button"
              className="flex min-w-[56px] flex-col items-center justify-center rounded-xl px-2 py-1.5 text-zinc-600"
              onClick={() => {
                if (!canDraw) {
                  showLocked();
                  return;
                }
                onUndo();
              }}
            >
              <Undo2 className="h-4 w-4" />
              <span className="mt-0.5 text-[10px] font-medium">{undoLabel}</span>
            </button>
          </div>
        </div>
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

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {DRAW_TOOLS.map((item) => renderHorizontalTool(item))}
          <button
            type="button"
            className="flex min-w-[56px] flex-col items-center justify-center rounded-xl px-2 py-1.5 text-zinc-600 hover:bg-zinc-50"
            onClick={() => {
              if (!canDraw) {
                showLocked();
                return;
              }
              onUndo();
            }}
          >
            <Undo2 className="h-4 w-4" />
            <span className="mt-0.5 text-[10px] font-medium">{undoLabel}</span>
          </button>
          <button
            type="button"
            className="flex min-w-[56px] flex-col items-center justify-center rounded-xl px-2 py-1.5 text-zinc-600 hover:bg-zinc-50"
            onClick={() => {
              if (!canDraw) {
                showLocked();
                return;
              }
              onClearAnnotations();
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="mt-0.5 text-[10px] font-medium">{clearLabel}</span>
          </button>
        </div>
      </div>
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
