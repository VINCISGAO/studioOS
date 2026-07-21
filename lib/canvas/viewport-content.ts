import { getNodesBounds, type Viewport } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import type { ViewportRect } from "@/lib/canvas/viewport-anchor";

function viewportBounds(viewport: Viewport, rect: ViewportRect) {
  return {
    minX: -viewport.x / viewport.zoom,
    minY: -viewport.y / viewport.zoom,
    maxX: (rect.width - viewport.x) / viewport.zoom,
    maxY: (rect.height - viewport.y) / viewport.zoom
  };
}

function intersects(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number }
) {
  return a.maxX >= b.minX && a.minX <= b.maxX && a.maxY >= b.minY && a.minY <= b.maxY;
}

function contentNodes(nodes: VincisCanvasNode[]) {
  const withoutFrames = nodes.filter((node) => node.type !== "frame");
  return withoutFrames.length > 0 ? withoutFrames : nodes;
}

export function isViewportShowingCanvasNodes(
  nodes: VincisCanvasNode[],
  viewport: Viewport,
  rect: ViewportRect
) {
  if (!nodes.length || rect.width <= 0 || rect.height <= 0) return true;

  const bounds = getNodesBounds(contentNodes(nodes));
  if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) return true;
  if (bounds.width <= 0 || bounds.height <= 0) return true;

  const nodeBox = {
    minX: bounds.x,
    minY: bounds.y,
    maxX: bounds.x + bounds.width,
    maxY: bounds.y + bounds.height
  };
  const view = viewportBounds(viewport, rect);
  return intersects(nodeBox, view);
}
