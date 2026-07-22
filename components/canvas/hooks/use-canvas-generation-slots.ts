"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GenerationKind } from "@/components/canvas/generation-panel";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import {
  createGenerationSlot,
  getGenerationCard,
  isUneditedGenerationSlot,
  nextLayoutIndex,
  type GenerationSlotKind
} from "@/lib/canvas/generation-layout";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import {
  nextSlotLayoutPosition,
  panelAnchorBelowNode,
  readViewportRect
} from "@/lib/canvas/viewport-anchor";
import type { Locale } from "@/lib/i18n";

type GenerationSession = {
  kind: GenerationKind;
  slotNodeId: string;
};

const KIND_MAP: Record<GenerationKind, GenerationSlotKind> = {
  image: "image",
  video: "video",
  music: "music"
};

export function useCanvasGenerationSlots({
  locale,
  canvasAreaRef,
  initialPanel = null,
  ready
}: {
  locale: Locale;
  canvasAreaRef: React.RefObject<HTMLDivElement | null>;
  initialPanel?: GenerationKind | null;
  ready: boolean;
}) {
  const addNode = useCanvasStore((state) => state.addNode);
  const nodes = useCanvasStore((state) => state.nodes);
  const viewport = useCanvasStore((state) => state.viewport);
  const [panel, setPanel] = useState<GenerationKind | null>(initialPanel);
  const [panelAnchor, setPanelAnchor] = useState<{ x: number; y: number } | null>(null);
  const [generationSession, setGenerationSession] = useState<GenerationSession | null>(null);
  const initialLayoutCreated = useRef(false);
  const creatingLayout = useRef(false);

  const readRect = useCallback(
    () => readViewportRect(canvasAreaRef.current),
    [canvasAreaRef]
  );

  const anchorPanelToNode = useCallback(
    (node: VincisCanvasNode, kind: GenerationKind) => {
      const state = useCanvasStore.getState();
      setGenerationSession({ kind, slotNodeId: node.id });
      setPanelAnchor(panelAnchorBelowNode(node, state.viewport, readRect()));
      setPanel(kind);
    },
    [readRect]
  );

  const createSlot = useCallback(
    (kind: GenerationKind) => {
      if (creatingLayout.current) return null;
      creatingLayout.current = true;
      try {
        const slotKind = KIND_MAP[kind];
        const state = useCanvasStore.getState();
        const rect = readRect();
        const layoutIndex = nextLayoutIndex(state.nodes, slotKind);
        const card = getGenerationCard(slotKind);
        const layout = createGenerationSlot({
          kind: slotKind,
          layoutIndex,
          position: nextSlotLayoutPosition(state.viewport, rect, layoutIndex, card),
          locale
        });
        addNode(layout.node);
        return layout;
      } finally {
        creatingLayout.current = false;
      }
    },
    [addNode, locale, readRect]
  );

  const openGeneration = useCallback(
    (kind: GenerationKind) => {
      const layout = createSlot(kind);
      if (!layout) return;
      anchorPanelToNode(layout.node, kind);
    },
    [anchorPanelToNode, createSlot]
  );

  const closeGenerationPanel = useCallback(() => {
    setPanel(null);
    setPanelAnchor(null);
    setGenerationSession(null);
  }, []);

  useEffect(() => {
    if (!panel || !generationSession) return;
    const node = nodes.find((item) => item.id === generationSession.slotNodeId);
    if (!node) return;
    setPanelAnchor(panelAnchorBelowNode(node, viewport, readRect()));
  }, [generationSession, nodes, panel, readRect, viewport]);

  useEffect(() => {
    if (!ready || initialPanel !== "video" || initialLayoutCreated.current) return;
    initialLayoutCreated.current = true;
    const existingSlot = useCanvasStore.getState().nodes.find((node) =>
      isUneditedGenerationSlot(node, "video")
    );
    if (existingSlot) {
      anchorPanelToNode(existingSlot, "video");
      return;
    }
    openGeneration("video");
  }, [anchorPanelToNode, initialPanel, openGeneration, ready]);

  const handleGenerationNodeClick = useCallback(
    (node: VincisCanvasNode) => {
      for (const kind of ["video", "image", "music"] as const) {
        if (isUneditedGenerationSlot(node, kind)) {
          anchorPanelToNode(node, kind);
          return true;
        }
      }
      return false;
    },
    [anchorPanelToNode]
  );

  return {
    panel,
    panelAnchor,
    generationSession,
    openGeneration,
    closeGenerationPanel,
    handleGenerationNodeClick
  };
}
