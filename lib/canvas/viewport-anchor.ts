import type { Viewport } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import { GENERATION_PANEL_HEIGHT, GENERATION_PANEL_WIDTH } from "@/lib/canvas/generation-ui";
import { VIDEO_CARD } from "@/lib/canvas/generation-layout";

let flowViewportReader: (() => Viewport) | null = null;

export function registerFlowViewportReader(reader: (() => Viewport) | null) {
  flowViewportReader = reader;
}

export function readCanvasViewport(fallback: Viewport): Viewport {
  return flowViewportReader?.() ?? fallback;
}

export type ViewportRect = {
  width: number;
  height: number;
};

export function readViewportRect(element: HTMLElement | null): ViewportRect {
  if (!element) {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { width: element.clientWidth, height: element.clientHeight };
}

export function spawnNodeAtViewportCenter(
  viewport: Viewport,
  rect: ViewportRect,
  card: { width: number; height: number; centerOffsetY?: number }
) {
  const center = viewportCenterFlowPoint(viewport, rect);
  const offsetY = card.centerOffsetY ?? 0;
  return {
    x: center.x - card.width / 2,
    y: center.y - card.height / 2 + offsetY
  };
}

export function viewportCenterFlowPoint(viewport: Viewport, rect: ViewportRect) {
  return {
    x: (rect.width / 2 - viewport.x) / viewport.zoom,
    y: (rect.height / 2 - viewport.y) / viewport.zoom
  };
}

export function flowToScreenPoint(
  point: { x: number; y: number },
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: point.x * viewport.zoom + viewport.x,
    y: point.y * viewport.zoom + viewport.y
  };
}

export function clampPanelAnchor(
  anchor: { x: number; y: number },
  rect: ViewportRect,
  panelWidth = GENERATION_PANEL_WIDTH,
  panelHeight = GENERATION_PANEL_HEIGHT
) {
  const margin = 16;
  const half = panelWidth / 2;
  return {
    x: Math.min(Math.max(anchor.x, margin + half), rect.width - margin - half),
    y: Math.min(Math.max(anchor.y, margin + panelHeight), rect.height - margin)
  };
}

export function clampPanelAnchorBelow(
  anchor: { x: number; y: number },
  rect: ViewportRect,
  panelWidth = GENERATION_PANEL_WIDTH,
  panelHeight = GENERATION_PANEL_HEIGHT
) {
  const margin = 16;
  const half = panelWidth / 2;
  return {
    x: Math.min(Math.max(anchor.x, margin + half), rect.width - margin - half),
    y: Math.min(Math.max(anchor.y, margin), rect.height - margin - panelHeight)
  };
}

/** Place generation panel at the visible canvas area center (uses translate(-50%, -50%)). */
export function panelAnchorViewportCenter(
  rect: ViewportRect,
  panelWidth: number,
  panelHeight: number
) {
  const margin = 16;
  const halfW = panelWidth / 2;
  const halfH = panelHeight / 2;
  const maxX = Math.max(margin + halfW, rect.width - margin - halfW);
  const maxY = Math.max(margin + halfH, rect.height - margin - halfH);
  return {
    x: Math.min(Math.max(rect.width / 2, margin + halfW), maxX),
    y: Math.min(Math.max(rect.height / 2, margin + halfH), maxY)
  };
}

function resolveNodeDimensions(node: Pick<VincisCanvasNode, "width" | "height" | "measured">) {
  return {
    width: node.width ?? node.measured?.width ?? VIDEO_CARD.width,
    height: node.height ?? node.measured?.height ?? VIDEO_CARD.height
  };
}

export function nextSlotLayoutPosition(
  viewport: Viewport,
  rect: ViewportRect,
  layoutIndex: number,
  card: { width: number; height: number; gapY?: number; centerOffsetY?: number }
): { x: number; y: number } {
  const center = viewportCenterFlowPoint(viewport, rect);
  const gapY = card.gapY ?? 32;
  const centerOffsetY = card.centerOffsetY ?? 0;
  return {
    x: center.x - card.width / 2,
    y: center.y - card.height / 2 + centerOffsetY + layoutIndex * (card.height + gapY)
  };
}

export function nextVideoLayoutPosition(
  viewport: Viewport,
  rect: ViewportRect,
  layoutIndex: number
): { x: number; y: number } {
  return nextSlotLayoutPosition(viewport, rect, layoutIndex, VIDEO_CARD);
}

export function panelAnchorAboveNode(
  node: Pick<VincisCanvasNode, "position" | "width" | "height" | "measured">,
  viewport: Viewport,
  rect: ViewportRect
) {
  const { width } = resolveNodeDimensions(node);
  const flowCenter = {
    x: node.position.x + width / 2,
    y: node.position.y
  };
  const screen = flowToScreenPoint(flowCenter, viewport);
  return clampPanelAnchor(
    { x: screen.x, y: screen.y - 12 },
    rect,
    GENERATION_PANEL_WIDTH,
    GENERATION_PANEL_HEIGHT + 40
  );
}

export function panelAnchorBelowNode(
  node: Pick<VincisCanvasNode, "position" | "width" | "height" | "measured">,
  viewport: Viewport,
  rect: ViewportRect,
  panelWidth = GENERATION_PANEL_WIDTH,
  panelHeight = GENERATION_PANEL_HEIGHT + 40
) {
  const { width, height } = resolveNodeDimensions(node);
  const flowAnchor = {
    x: node.position.x + width / 2,
    y: node.position.y + height
  };
  const screen = flowToScreenPoint(flowAnchor, viewport);
  return clampPanelAnchorBelow({ x: screen.x, y: screen.y + 12 }, rect, panelWidth, panelHeight);
}

export function defaultPanelAnchor(rect: ViewportRect) {
  return clampPanelAnchor(
    { x: rect.width / 2, y: rect.height - 112 },
    rect,
    GENERATION_PANEL_WIDTH,
    GENERATION_PANEL_HEIGHT + 40
  );
}
