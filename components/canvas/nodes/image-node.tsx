"use client";

import { ImageIcon, Sparkles } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { CanvasNodeFrame } from "@/components/canvas/nodes/canvas-node-frame";

export function ImageNode({ data, selected }: NodeProps<VincisCanvasNode>) {
  return (
    <CanvasNodeFrame data={data} selected={selected} icon={<ImageIcon className="h-4 w-4" />}>
      {data.status === "loading" ? (
        <div className="flex h-full flex-col items-center justify-center bg-zinc-50 p-5 text-center">
          <Sparkles className="mb-3 h-5 w-5 animate-pulse text-zinc-400" />
          <p className="text-xs text-zinc-500">正在生成图像…</p>
          <div className="mt-3 h-1 w-24 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-zinc-800 transition-all"
              style={{ width: `${data.progress ?? 12}%` }}
            />
          </div>
        </div>
      ) : data.status === "idle" && !data.url ? (
        <div className="flex h-full flex-col items-center justify-center bg-zinc-50 p-5 text-center">
          <ImageIcon className="mb-3 h-5 w-5 text-zinc-400" />
          <p className="px-2 text-xs leading-5 text-zinc-400">{data.prompt || "等待生成图片…"}</p>
        </div>
      ) : data.url ? (
        // Authenticated canvas assets intentionally bypass Next image optimization.
        <img
          src={data.url}
          alt={data.prompt || data.fileName || "Canvas image"}
          draggable={false}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-end bg-[radial-gradient(circle_at_25%_20%,#ffffff_0%,#e4e4e7_38%,#a1a1aa_100%)] p-4">
          <p className="line-clamp-3 rounded-lg bg-white/75 px-3 py-2 text-xs leading-5 text-zinc-700 backdrop-blur">
            {data.prompt || "VINCIS mock image"}
          </p>
        </div>
      )}
    </CanvasNodeFrame>
  );
}
