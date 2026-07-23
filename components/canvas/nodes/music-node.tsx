"use client";

import { useEffect } from "react";
import type { NodeProps } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import { MusicNodeGeneratingView } from "@/components/canvas/nodes/music-node-generating-view";
import {
  MusicNodeFailedView,
  MusicNodeIdleView,
  MusicNodeReadyView
} from "@/components/canvas/nodes/music-node-ready-view";
import { MusicNodeShell } from "@/components/canvas/nodes/music-node-shell";
import {
  MUSIC_NODE_CARD,
  MUSIC_NODE_LOADING_CARD,
  MUSIC_NODE_READY_CARD
} from "@/lib/canvas/music-node-design";

export function MusicNode({ id, data, selected, width, height }: NodeProps<VincisCanvasNode>) {
  const onNodesChange = useCanvasStore((state) => state.onNodesChange);
  const loading = data.status === "loading";
  const ready = data.status === "ready" && Boolean(data.url);
  const failed = data.status === "failed";
  const card = loading ? MUSIC_NODE_LOADING_CARD : ready ? MUSIC_NODE_READY_CARD : MUSIC_NODE_CARD;

  useEffect(() => {
    if (loading) {
      if (width === card.width && height === card.height) return;
      onNodesChange([
        {
          id,
          type: "dimensions",
          dimensions: { width: card.width, height: card.height },
          setAttributes: true
        }
      ]);
      return;
    }

    if (!ready) return;
    if (width === MUSIC_NODE_READY_CARD.width && height === MUSIC_NODE_READY_CARD.height) {
      return;
    }
    onNodesChange([
      {
        id,
        type: "dimensions",
        dimensions: {
          width: MUSIC_NODE_READY_CARD.width,
          height: MUSIC_NODE_READY_CARD.height
        },
        setAttributes: true
      }
    ]);
  }, [card.height, card.width, height, id, loading, onNodesChange, ready, width]);

  return (
    <MusicNodeShell
      selected={selected}
      compact={ready}
      loading={loading}
      resizable={false}
      minWidth={card.width}
      minHeight={card.height}
    >
      {loading ? (
        <MusicNodeGeneratingView data={data} />
      ) : ready ? (
        <MusicNodeReadyView nodeId={id} data={data} />
      ) : failed ? (
        <MusicNodeFailedView data={data} />
      ) : (
        <MusicNodeIdleView data={data} />
      )}
    </MusicNodeShell>
  );
}
