import type { NodeChange } from "@xyflow/react";
import type { VincisCanvasEdge, VincisCanvasNode } from "@/lib/canvas/types";

export type CanvasHistoryEntry = {
  nodes: VincisCanvasNode[];
  edges: VincisCanvasEdge[];
};

function cloneNode(node: VincisCanvasNode): VincisCanvasNode {
  return {
    ...node,
    position: { ...node.position },
    data: { ...node.data },
    measured: node.measured ? { ...node.measured } : undefined
  };
}

function cloneEdge(edge: VincisCanvasEdge): VincisCanvasEdge {
  return {
    ...edge,
    data: edge.data ? { ...edge.data } : undefined
  };
}

export function snapshotCanvasGraph(
  nodes: VincisCanvasNode[],
  edges: VincisCanvasEdge[]
): CanvasHistoryEntry {
  return {
    nodes: nodes.map(cloneNode),
    edges: edges.map(cloneEdge)
  };
}

export function shouldRecordNodeHistory(changes: NodeChange<VincisCanvasNode>[]) {
  return changes.some((change) => {
    if (change.type === "select" || change.type === "dimensions") return false;
    if (change.type === "position") return change.dragging !== true;
    return true;
  });
}
