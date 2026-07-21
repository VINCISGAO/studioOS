"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { CanvasNodeFrame } from "@/components/canvas/nodes/canvas-node-frame";

export function LoadingNode({ data, selected }: NodeProps<VincisCanvasNode>) {
  return (
    <CanvasNodeFrame data={data} selected={selected} icon={<Sparkles className="h-4 w-4" />}>
      <div className="flex h-full flex-col items-center justify-center bg-zinc-50 p-5 text-center">
        <LoaderCircle className="mb-3 h-6 w-6 animate-spin text-zinc-500" />
        <p className="text-xs font-medium text-zinc-700">{data.title}</p>
        <p className="mt-1 line-clamp-2 max-w-[230px] text-[11px] leading-4 text-zinc-400">
          {data.prompt}
        </p>
        <div className="mt-4 h-1 w-28 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-500"
            style={{ width: `${data.progress ?? 8}%` }}
          />
        </div>
      </div>
    </CanvasNodeFrame>
  );
}
