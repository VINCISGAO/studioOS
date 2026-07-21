"use client";

import { Play } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { CanvasVideoCard } from "@/components/canvas/nodes/canvas-video-card";
import { CanvasVideoNodeMenu } from "@/components/canvas/nodes/canvas-video-node-menu";

export function VideoNode({ id, data, selected }: NodeProps<VincisCanvasNode>) {
  return (
    <>
      <CanvasVideoNodeMenu nodeId={id} data={data} selected={selected} />
      <CanvasVideoCard data={data} selected={selected}>
        {data.status === "loading" ? (
          <div className="flex h-full flex-col items-center justify-center bg-zinc-50 p-5 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <Play className="ml-0.5 h-5 w-5 animate-pulse text-zinc-500" />
            </span>
            <p className="text-xs text-zinc-500">正在生成视频… {data.progress ?? 12}%</p>
          </div>
        ) : data.url ? (
          <video
            src={data.url}
            controls
            playsInline
            preload="metadata"
            className="nodrag nopan h-full w-full bg-zinc-100 object-contain"
          />
        ) : data.status === "idle" ? (
          <div className="flex h-full flex-col items-center justify-center bg-white p-5 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <Play className="ml-0.5 h-5 w-5 text-zinc-400" />
            </span>
            <p className="text-xs leading-5 text-zinc-400">{data.prompt || "等待生成视频…"}</p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-white p-5 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <Play className="ml-0.5 h-5 w-5 text-zinc-400" />
            </span>
            <p className="line-clamp-3 max-w-[240px] text-xs leading-5 text-zinc-500">
              {data.prompt || "VINCIS mock video"}
            </p>
          </div>
        )}
      </CanvasVideoCard>
    </>
  );
}
