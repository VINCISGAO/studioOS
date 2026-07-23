"use client";

import { Play } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { CanvasVideoNodeMenu } from "@/components/canvas/nodes/canvas-video-node-menu";
import { VideoNodeGeneratingView } from "@/components/canvas/nodes/video-node-generating-view";
import { VideoNodeReadyPlayer } from "@/components/canvas/nodes/video-node-ready-player";
import { VideoNodeShell } from "@/components/canvas/nodes/video-node-shell";
import { VIDEO_NODE_READY_UI, videoNodeReadyCopy } from "@/lib/canvas/video-node-ready-design";
import { cn } from "@/lib/utils";

function VideoNodePlaceholder({
  prompt,
  message
}: {
  prompt?: string;
  message: string;
}) {
  return (
    <div
      className={cn(
        VIDEO_NODE_READY_UI.shell,
        VIDEO_NODE_READY_UI.shellDefault,
        "flex flex-col items-center justify-center bg-white p-5 text-center"
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
        <Play className="ml-0.5 h-5 w-5 text-zinc-400" />
      </span>
      <p className="line-clamp-3 max-w-[240px] text-xs leading-5 text-zinc-500">
        {prompt || message}
      </p>
    </div>
  );
}

export function VideoNode({ id, data, selected }: NodeProps<VincisCanvasNode>) {
  const t = videoNodeReadyCopy.zh;

  if (data.status === "loading") {
    return (
      <VideoNodeShell selected={selected}>
        <VideoNodeGeneratingView data={data} />
      </VideoNodeShell>
    );
  }

  return (
    <div className="h-full w-full">
      {data.status === "ready" && data.url ? (
        <CanvasVideoNodeMenu nodeId={id} data={data} selected={selected} />
      ) : null}
      {data.url ? (
        <VideoNodeReadyPlayer data={data} selected={selected} />
      ) : data.status === "idle" ? (
        <VideoNodePlaceholder prompt={data.prompt} message={t.idlePrompt} />
      ) : data.status === "failed" ? (
        <VideoNodePlaceholder prompt={data.error || data.prompt} message={t.waiting} />
      ) : (
        <VideoNodePlaceholder prompt={data.prompt} message={t.waiting} />
      )}
    </div>
  );
}
