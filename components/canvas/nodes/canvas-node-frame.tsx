"use client";

import type { ReactNode } from "react";
import { NodeResizer } from "@xyflow/react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

export function CanvasNodeFrame({
  data,
  selected,
  icon,
  children,
  minWidth = 240,
  minHeight = 160
}: {
  data: CanvasNodeData;
  selected: boolean;
  icon: ReactNode;
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
}) {
  return (
    <div
      className={cn(
        "group relative h-full min-h-[160px] w-full min-w-[240px] overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow",
        selected ? "border-zinc-900 shadow-lg" : "border-black/10 hover:shadow-md"
      )}
    >
      <NodeResizer isVisible={selected} minWidth={minWidth} minHeight={minHeight} />

      <div className="flex h-10 items-center justify-between border-b border-zinc-100 px-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-zinc-700">
          <span className="text-zinc-500">{icon}</span>
          <span className="truncate">{data.title}</span>
        </div>
        {data.status === "loading" ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-zinc-400" />
        ) : data.status === "failed" ? (
          <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        )}
      </div>
      <div className="h-[calc(100%-2.5rem)]">{children}</div>
    </div>
  );
}
