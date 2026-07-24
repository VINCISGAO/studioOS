"use client";

import { memo } from "react";
import { Frame } from "lucide-react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { canvasNodePropsAreEqual } from "@/lib/canvas/canvas-node-memo";
import { cn } from "@/lib/utils";

function FrameNodeView({ data, selected }: NodeProps<VincisCanvasNode>) {
  return (
    <div
      className={cn(
        "relative h-full min-h-[260px] w-full min-w-[360px] rounded-3xl border-2 bg-white/20",
        selected ? "border-zinc-700 shadow-sm" : "border-dashed border-zinc-300"
      )}
    >
      <NodeResizer isVisible={selected} minWidth={360} minHeight={260} />
      <div className="absolute -top-9 left-0 flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200">
        <Frame className="h-3.5 w-3.5" />
        <span>{data.title}</span>
      </div>
    </div>
  );
}

export const FrameNode = memo(FrameNodeView, canvasNodePropsAreEqual);
