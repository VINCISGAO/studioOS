import dagre from "@dagrejs/dagre";
import type { VincisCanvasEdge, VincisCanvasNode } from "@/lib/canvas/types";

export function autoLayoutCanvas(
  nodes: VincisCanvasNode[],
  edges: VincisCanvasEdge[]
): VincisCanvasNode[] {
  if (!nodes.length) return nodes;

  const topLevel = nodes.filter((node) => !node.parentId);
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "LR", nodesep: 32, ranksep: 64 });

  topLevel.forEach((node) => {
    graph.setNode(node.id, {
      width: node.measured?.width ?? node.width ?? 320,
      height: node.measured?.height ?? node.height ?? 220
    });
  });
  const topIds = new Set(topLevel.map((node) => node.id));
  edges
    .filter((edge) => topIds.has(edge.source) && topIds.has(edge.target))
    .forEach((edge) => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  return nodes.map((node) => {
    if (node.parentId) {
      if (node.type === "text") return node;
      const siblings = nodes
        .filter((item) => item.parentId === node.parentId && item.type !== "text")
        .sort((a, b) => a.id.localeCompare(b.id));
      const index = siblings.findIndex((item) => item.id === node.id);
      return {
        ...node,
        position: {
          x: 32 + (index % 3) * 350,
          y: 205 + Math.floor(index / 3) * 245
        }
      };
    }
    const point = graph.node(node.id) as { x: number; y: number; width: number; height: number };
    return {
      ...node,
      position: {
        x: point.x - point.width / 2,
        y: point.y - point.height / 2
      }
    };
  });
}
