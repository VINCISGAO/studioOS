"use client";

import { FileUp } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { CanvasNodeFrame } from "@/components/canvas/nodes/canvas-node-frame";
import { CanvasVideoNodeMenu } from "@/components/canvas/nodes/canvas-video-node-menu";

export function UploadNode({ id, data, selected }: NodeProps<VincisCanvasNode>) {
  const mime = data.mimeType ?? "";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  const isAudio = mime.startsWith("audio/");

  return (
    <>
      {isVideo ? <CanvasVideoNodeMenu nodeId={id} data={data} selected={selected} variant="upload" /> : null}
      <CanvasNodeFrame data={data} selected={selected} icon={<FileUp className="h-4 w-4" />}>
      {isImage && data.url ? (
        <img
          src={data.url}
          alt={data.fileName || "Uploaded canvas asset"}
          draggable={false}
          className="h-full w-full object-cover"
        />
      ) : isVideo && data.url ? (
        <video
          src={data.url}
          controls
          playsInline
          preload="metadata"
          className="nodrag nopan h-full w-full bg-black object-contain"
        />
      ) : isAudio && data.url ? (
        <div className="flex h-full flex-col items-center justify-center bg-zinc-50 p-5">
          <FileUp className="mb-4 h-7 w-7 text-zinc-400" />
          <audio src={data.url} controls preload="metadata" className="nodrag nopan w-full" />
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center bg-zinc-50 p-5 text-center">
          <FileUp className="mb-3 h-7 w-7 text-zinc-400" />
          <p className="max-w-[220px] truncate text-xs text-zinc-500">
            {data.fileName || "Uploaded asset"}
          </p>
        </div>
      )}
    </CanvasNodeFrame>
    </>
  );
}
