"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { useCanvasStore } from "@/components/canvas/canvas-store";

export function JobStatusPanel() {
  const nodes = useCanvasStore((state) => state.nodes);
  const active = nodes.filter((node) => node.data.status === "loading");
  const failed = nodes.filter((node) => node.data.status === "failed");

  if (!active.length && !failed.length) return null;

  return (
    <div className="absolute bottom-20 right-4 z-20 w-56 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur">
      {active.length ? (
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span>{active.length} 个生成任务进行中</span>
        </div>
      ) : null}
      {failed.length ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-rose-600">
          <AlertCircle className="h-4 w-4" />
          <span>{failed.length} 个任务失败</span>
        </div>
      ) : null}
    </div>
  );
}
