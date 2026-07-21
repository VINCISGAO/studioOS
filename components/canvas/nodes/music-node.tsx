"use client";

import { Music2 } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { CanvasNodeFrame } from "@/components/canvas/nodes/canvas-node-frame";

const WAVEFORM = [18, 32, 44, 28, 52, 38, 24, 46, 56, 34, 20, 42, 50, 30, 16, 36];

export function MusicNode({ data, selected }: NodeProps<VincisCanvasNode>) {
  return (
    <CanvasNodeFrame
      data={data}
      selected={selected}
      icon={<Music2 className="h-4 w-4" />}
      minWidth={280}
      minHeight={140}
    >
      <div className="flex h-full flex-col justify-center bg-zinc-50 px-5">
        <div className="flex h-14 items-center justify-center gap-1 overflow-hidden rounded-xl bg-white px-3 ring-1 ring-zinc-200">
          {WAVEFORM.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-1 rounded-full bg-zinc-700"
              style={{
                height: `${data.status === "loading" ? Math.max(10, height * 0.55) : height}%`,
                opacity: data.status === "loading" ? 0.45 : 0.8
              }}
            />
          ))}
        </div>
        {data.url ? (
          <audio
            src={data.url}
            controls
            preload="metadata"
            className="nodrag nopan mt-3 h-8 w-full"
          />
        ) : (
          <p className="mt-3 truncate text-center text-xs text-zinc-500">
            {data.status === "loading"
              ? `正在生成音乐… ${data.progress ?? 12}%`
              : data.prompt || "VINCIS mock music"}
          </p>
        )}
      </div>
    </CanvasNodeFrame>
  );
}
