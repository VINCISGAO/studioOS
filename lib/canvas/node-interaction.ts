import type { VincisCanvasNode } from "@/lib/canvas/types";

export const CANVAS_MEDIA_NODE_TYPES = new Set(["image", "video", "upload"]);

export function isCanvasMediaNode(node: Pick<VincisCanvasNode, "type">) {
  return CANVAS_MEDIA_NODE_TYPES.has(node.type ?? "");
}

export function nodeZIndex(node: VincisCanvasNode) {
  return node.zIndex ?? 0;
}

export function applyCanvasNodeInteractionFlags(node: VincisCanvasNode): VincisCanvasNode {
  const locked = node.data.locked === true;
  const hidden = node.data.hidden === true;
  const draggable = locked ? false : node.draggable ?? true;
  const selectable = locked ? false : node.selectable ?? true;

  if (
    node.hidden === hidden &&
    node.draggable === draggable &&
    node.selectable === selectable
  ) {
    return node;
  }

  return {
    ...node,
    hidden,
    draggable,
    selectable
  };
}

export function applyCanvasNodeInteractionFlagsAll(nodes: VincisCanvasNode[]) {
  return nodes.map(applyCanvasNodeInteractionFlags);
}

export function deselectAllCanvasNodes(nodes: VincisCanvasNode[]) {
  return nodes.map((node) => (node.selected ? { ...node, selected: false } : node));
}

export function nodeSize(node: VincisCanvasNode) {
  return {
    width: node.measured?.width ?? node.width ?? 320,
    height: node.measured?.height ?? node.height ?? 220
  };
}
