"use client";

import { ImageIcon, Music2, Video } from "lucide-react";
import { CanvasInteractionToolPicker } from "@/components/canvas/canvas-interaction-tool-picker";
import { cn } from "@/lib/utils";

type GenerationKind = "image" | "video" | "music";

function ToolButton({
  label,
  shortcut,
  children,
  onClick
}: {
  label: string;
  shortcut?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
      )}
    >
      {children}
    </button>
  );
}

export function FloatingToolbar({
  onGenerate
}: {
  onGenerate: (kind: GenerationKind) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-4 z-30 flex justify-center">
      <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-xl backdrop-blur">
        <CanvasInteractionToolPicker />
        <span className="mx-1 h-7 w-px shrink-0 bg-zinc-200" />
        <div className="flex items-center gap-1 overflow-x-auto">
        <ToolButton label="图片" shortcut="I" onClick={() => onGenerate("image")}>
          <ImageIcon className="h-[18px] w-[18px]" />
        </ToolButton>
        <ToolButton label="视频" shortcut="S" onClick={() => onGenerate("video")}>
          <Video className="h-[18px] w-[18px]" />
        </ToolButton>
        <ToolButton label="音乐" shortcut="M" onClick={() => onGenerate("music")}>
          <Music2 className="h-[18px] w-[18px]" />
        </ToolButton>
        </div>
      </div>
    </div>
  );
}
