"use client";

import { Music2 } from "lucide-react";
import type { CanvasNodeData } from "@/lib/canvas/types";
import { MusicNodeHeader } from "@/components/canvas/nodes/music-node-generating-view";
import { formatValidationMessage } from "@/lib/canvas/format-validation-message";
import { MUSIC_NODE_LOADING_UI, musicNodeCopy } from "@/lib/canvas/music-node-design";

export function MusicNodeIdleView({ data }: { data: CanvasNodeData }) {
  const t = musicNodeCopy.zh;

  return (
    <>
      <MusicNodeHeader title={data.title || t.title} subtitle={t.waiting} />
      <div className={MUSIC_NODE_LOADING_UI.panel}>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F3F0FF]">
          <Music2 className="h-[18px] w-[18px] text-[#C4B5FD]" />
        </span>
        <p className={MUSIC_NODE_LOADING_UI.hint}>{data.prompt || t.waiting}</p>
      </div>
    </>
  );
}

export function MusicNodeFailedView({ data }: { data: CanvasNodeData }) {
  const t = musicNodeCopy.zh;
  const errorMessage = data.error ? formatValidationMessage(data.error) : t.failed;

  return (
    <>
      <MusicNodeHeader title={data.title || t.title} subtitle={errorMessage} />
      <div className="mt-2.5 flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/70 px-4 py-3 text-center">
        <p className="text-[11px] leading-4 text-rose-600">{errorMessage}</p>
      </div>
    </>
  );
}
