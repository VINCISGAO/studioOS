"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VIDEO_NODE_LOADING_UI } from "@/lib/canvas/video-node-design";

export function VideoNodeShell({
  selected,
  children
}: {
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        VIDEO_NODE_LOADING_UI.shell,
        selected ? VIDEO_NODE_LOADING_UI.shellSelected : null
      )}
    >
      <div className={VIDEO_NODE_LOADING_UI.padding}>{children}</div>
    </div>
  );
}
