"use client";

import { AlertCircle } from "lucide-react";
import { useCanvasStore } from "@/components/canvas/canvas-store";

function selectFailedJobCount(state: { nodes: { data: { status?: string } }[] }) {
  let count = 0;
  for (const node of state.nodes) {
    if (node.data.status === "failed") count += 1;
  }
  return count;
}

/** Failed jobs only — in-progress state lives on canvas loading cards (no duplicate progress). */
export function JobStatusPanel() {
  const failedCount = useCanvasStore(selectFailedJobCount);

  if (!failedCount) return null;

  return (
    <div className="absolute bottom-20 right-4 z-20 w-56 rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2 text-xs text-rose-600">
        <AlertCircle className="h-4 w-4" />
        <span>{failedCount} 个任务失败</span>
      </div>
    </div>
  );
}
