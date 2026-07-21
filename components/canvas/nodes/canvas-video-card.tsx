"use client";

import type { ReactNode } from "react";
import { AlertCircle, LoaderCircle, Play, VideoIcon } from "lucide-react";
import { NodeResizer, NodeToolbar, Position } from "@xyflow/react";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { cn } from "@/lib/utils";

export function CanvasVideoCard({
  data,
  selected,
  children
}: {
  data: CanvasNodeData;
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        align="start"
        offset={8}
        className="!border-0 !bg-transparent !p-0 !shadow-none"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white">
            <Play className="ml-0.5 h-3 w-3 fill-current" />
          </span>
          {data.title}
        </div>
      </NodeToolbar>

      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow",
          selected ? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]" : "border-zinc-200"
        )}
      >
        <NodeResizer
          isVisible={selected}
          minWidth={280}
          minHeight={180}
          lineClassName="canvas-video-resizer !border-blue-500"
          handleClassName="canvas-video-resizer !h-2 !w-2 !border-blue-500 !bg-white"
        />

        <div className="flex h-10 items-center justify-between border-b border-zinc-100 px-3">
          <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-zinc-700">
            <VideoIcon className="h-4 w-4 text-zinc-500" />
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
    </>
  );
}
