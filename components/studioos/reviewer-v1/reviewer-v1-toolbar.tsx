"use client";

import type { ComponentType } from "react";
import {
  MousePointer2,
  PenLine,
  ArrowRight,
  Square,
  Circle,
  Type,
  Trash2,
  Undo2,
  Redo2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getReviewerV1Copy } from "@/components/studioos/reviewer-v1/reviewer-v1-copy";
import type { Locale } from "@/lib/i18n";
import type { ReviewerTool } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import {
  REVIEWER_FOCUS_STROKE_TOOLS,
  ReviewerFocusStrokeControls
} from "@/components/studioos/reviewer-skeleton/reviewer-focus-stroke-controls";

const DRAW_TOOLS: Array<{
  key: ReviewerTool;
  icon: ComponentType<{ className?: string }>;
  labelKey: keyof ReturnType<typeof getReviewerV1Copy>["toolbar"];
}> = [
  { key: "select", icon: MousePointer2, labelKey: "select" },
  { key: "pen", icon: PenLine, labelKey: "pen" },
  { key: "arrow", icon: ArrowRight, labelKey: "arrow" },
  { key: "rect", icon: Square, labelKey: "rect" },
  { key: "circle", icon: Circle, labelKey: "circle" },
  { key: "text", icon: Type, labelKey: "text" }
];

export function ReviewerV1Toolbar({
  locale,
  activeTool,
  canDraw,
  penColor,
  penSize,
  onToolChange,
  onUndo,
  onPenColorChange,
  onPenSizeChange
}: {
  locale: Locale;
  activeTool: ReviewerTool;
  canDraw: boolean;
  penColor: string;
  penSize: number;
  onToolChange: (tool: ReviewerTool) => void;
  onUndo: () => void;
  onPenColorChange: (value: string) => void;
  onPenSizeChange: (value: number) => void;
}) {
  const t = getReviewerV1Copy(locale);
  const strokeControlsVisible = REVIEWER_FOCUS_STROKE_TOOLS.includes(
    activeTool as (typeof REVIEWER_FOCUS_STROKE_TOOLS)[number]
  );

  function toolButton(item: (typeof DRAW_TOOLS)[number]) {
    const Icon = item.icon;
    const active = activeTool === item.key;
    return (
      <button
        key={item.key}
        type="button"
        disabled={!canDraw && item.key !== "select"}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg border transition",
          active
            ? "border-violet-300 bg-violet-600 text-white shadow-sm"
            : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50",
          !canDraw && item.key !== "select" ? "opacity-40" : ""
        )}
        title={t.toolbar[item.labelKey]}
        onClick={() => onToolChange(item.key)}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="flex shrink-0 flex-row flex-wrap gap-1 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm xl:w-14 xl:flex-col xl:flex-nowrap xl:items-center xl:p-2">
      {DRAW_TOOLS.map(toolButton)}
      <button
        type="button"
        disabled={!canDraw}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg border transition",
          activeTool === "delete"
            ? "border-red-300 bg-red-50 text-red-600"
            : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50",
          !canDraw ? "opacity-40" : ""
        )}
        title={t.toolbar.delete}
        onClick={() => onToolChange("delete")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={!canDraw}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-zinc-600 hover:bg-zinc-50",
          !canDraw ? "opacity-40" : ""
        )}
        title={t.toolbar.undo}
        onClick={onUndo}
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-zinc-300"
        title="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </button>
      {strokeControlsVisible ? (
        <ReviewerFocusStrokeControls
          locale={locale}
          penColor={penColor}
          penSize={penSize}
          onPenColorChange={onPenColorChange}
          onPenSizeChange={onPenSizeChange}
          layout="sidebar"
        />
      ) : null}
    </aside>
  );
}
