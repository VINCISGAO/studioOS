"use client";

import type { ReactNode } from "react";
import { NodeResizer } from "@xyflow/react";
import { cn } from "@/lib/utils";
import {
  MUSIC_NODE_CARD,
  MUSIC_NODE_LOADING_UI,
  MUSIC_NODE_READY_UI,
  MUSIC_NODE_SHELL
} from "@/lib/canvas/music-node-design";

export function MusicNodeShell({
  selected,
  children,
  compact = false,
  loading = false,
  resizable = false,
  minWidth = MUSIC_NODE_CARD.minWidth,
  minHeight = MUSIC_NODE_CARD.minHeight
}: {
  selected: boolean;
  children: ReactNode;
  compact?: boolean;
  loading?: boolean;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
}) {
  const padding = compact
    ? MUSIC_NODE_READY_UI.shellPadding
    : loading
      ? MUSIC_NODE_LOADING_UI.shellPadding
      : MUSIC_NODE_SHELL.padding;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-white shadow-sm transition-[border-color,box-shadow]",
        compact ? MUSIC_NODE_SHELL.radiusCompact : MUSIC_NODE_SHELL.radius,
        selected ? MUSIC_NODE_SHELL.borderSelected : MUSIC_NODE_SHELL.border
      )}
    >
      {resizable ? (
        <NodeResizer
          isVisible={selected}
          minWidth={minWidth}
          minHeight={minHeight}
          lineClassName="!border-violet-300"
          handleClassName="!h-2 !w-2 !border-violet-300 !bg-white"
        />
      ) : null}
      <div className={cn("flex h-full flex-col", padding)}>{children}</div>
    </div>
  );
}
