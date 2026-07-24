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
import { generationPanelDimensions } from "@/lib/canvas/generation-panel-layout";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import {
  nextSlotLayoutPosition,
  panelAnchorViewportCenter,
  readCanvasViewport,
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

  const centerPanelAnchor = useCallback(
    (kind: GenerationKind) => {
      const { width, height } = generationPanelDimensions(kind);
      return panelAnchorViewportCenter(readRect(), width, height);
    },
    [readRect]
  );

  const openPanelForNode = useCallback(
    (node: VincisCanvasNode, kind: GenerationKind) => {
      setGenerationSession({ kind, slotNodeId: node.id });
      setPanelAnchor(centerPanelAnchor(kind));
      setPanel(kind);
    },
    [centerPanelAnchor]
  );

  const createSlot = useCallback(
    (kind: GenerationKind) => {
      if (creatingLayout.current) return null;
      creatingLayout.current = true;
      try {
        const slotKind = KIND_MAP[kind];
        const state = useCanvasStore.getState();
        const rect = readRect();
        const viewport = readCanvasViewport(state.viewport);
        const layoutIndex = nextLayoutIndex(state.nodes, slotKind);
        const card = getGenerationCard(slotKind);
        const layout = createGenerationSlot({
          kind: slotKind,
          layoutIndex,
          position: nextSlotLayoutPosition(viewport, rect, layoutIndex, card),
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
      const existingSlot = useCanvasStore.getState().nodes.find((node) =>
        isUneditedGenerationSlot(node, kind)
      );
      if (existingSlot) {
        openPanelForNode(existingSlot, kind);
        return;
      }
      const layout = createSlot(kind);
      if (!layout) return;
      openPanelForNode(layout.node, kind);
    },
    [createSlot, openPanelForNode]
  );

  const closeGenerationPanel = useCallback(() => {
    setPanel(null);
    setPanelAnchor(null);
    setGenerationSession(null);
  }, []);

  useEffect(() => {
    if (!panel) return;
    setPanelAnchor(centerPanelAnchor(panel));
  }, [centerPanelAnchor, panel, viewport]);

  useEffect(() => {
    if (!panel) return;
    const element = canvasAreaRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      setPanelAnchor(centerPanelAnchor(panel));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [canvasAreaRef, centerPanelAnchor, panel]);

  useEffect(() => {
    if (!ready || initialPanel !== "video" || initialLayoutCreated.current) return;
    initialLayoutCreated.current = true;
    openGeneration("video");
  }, [initialPanel, openGeneration, ready]);

  const handleGenerationNodeClick = useCallback(
    (node: VincisCanvasNode) => {
      for (const kind of ["video", "image", "music"] as const) {
        if (isUneditedGenerationSlot(node, kind)) {
          openPanelForNode(node, kind);
          return true;
        }
      }
      return false;
    },
    [openPanelForNode]
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
