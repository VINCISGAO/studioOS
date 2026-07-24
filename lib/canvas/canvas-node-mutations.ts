import { autoLayoutCanvas } from "@/lib/canvas/layout";
import { MUSIC_NODE_READY_CARD } from "@/lib/canvas/music-node-design";
import {
  applyCanvasNodeInteractionFlags,
  applyCanvasNodeInteractionFlagsAll,
  isCanvasMediaNode,
  nodeSize,
  nodeZIndex
} from "@/lib/canvas/node-interaction";
import type { VincisCanvasEdge, VincisCanvasNode, GenerationJobEvent } from "@/lib/canvas/types";

function selectedNodes(nodes: VincisCanvasNode[], selectedNodeIds: string[]) {
  const selected = new Set(selectedNodeIds);
  return nodes.filter((node) => selected.has(node.id));
}

export function deleteSelectedNodes(
  nodes: VincisCanvasNode[],
  edges: VincisCanvasEdge[],
  selectedNodeIds: string[]
) {
  const selected = new Set(selectedNodeIds);
  nodes.forEach((node) => {
    if (node.parentId && selected.has(node.parentId)) selected.add(node.id);
  });
  return {
    nodes: nodes.filter((node) => !selected.has(node.id)),
    edges: edges.filter((edge) => !selected.has(edge.source) && !selected.has(edge.target)),
    selectedNodeIds: [] as string[]
  };
}

export function cutSelectedNodes(
  nodes: VincisCanvasNode[],
  edges: VincisCanvasEdge[],
  selectedNodeIds: string[]
) {
  const picked = selectedNodes(nodes, selectedNodeIds);
  if (!picked.length) return null;
  const removed = deleteSelectedNodes(nodes, edges, selectedNodeIds);
  return {
    ...removed,
    clipboardNodes: picked.map((node) => ({ ...node, selected: false }))
  };
}

export function reorderSelectedZIndex(
  nodes: VincisCanvasNode[],
  selectedNodeIds: string[],
  mode: "forward" | "backward" | "front" | "back"
) {
  if (!selectedNodeIds.length) return nodes;
  const selected = new Set(selectedNodeIds);
  const sorted = [...nodes].sort((a, b) => nodeZIndex(a) - nodeZIndex(b));

  if (mode === "front") {
    const max = Math.max(...nodes.map(nodeZIndex), 0);
    return applyCanvasNodeInteractionFlagsAll(
      nodes.map((node) =>
        selected.has(node.id) ? { ...node, zIndex: max + 1 + selectedNodeIds.indexOf(node.id) } : node
      )
    );
  }

  if (mode === "back") {
    const min = Math.min(...nodes.map(nodeZIndex), 0);
    return applyCanvasNodeInteractionFlagsAll(
      nodes.map((node) =>
        selected.has(node.id) ? { ...node, zIndex: min - 1 - selectedNodeIds.indexOf(node.id) } : node
      )
    );
  }

  const next = new Map(nodes.map((node) => [node.id, { ...node }]));
  if (mode === "forward") {
    for (let index = sorted.length - 2; index >= 0; index -= 1) {
      const current = sorted[index];
      const above = sorted[index + 1];
      if (!selected.has(current.id) || selected.has(above.id)) continue;
      next.get(current.id)!.zIndex = nodeZIndex(above);
      next.get(above.id)!.zIndex = nodeZIndex(current);
      break;
    }
  } else {
    for (let index = 1; index < sorted.length; index += 1) {
      const current = sorted[index];
      const below = sorted[index - 1];
      if (!selected.has(current.id) || selected.has(below.id)) continue;
      next.get(current.id)!.zIndex = nodeZIndex(below);
      next.get(below.id)!.zIndex = nodeZIndex(current);
      break;
    }
  }

  return applyCanvasNodeInteractionFlagsAll(Array.from(next.values()));
}

export function ungroupSelectedNodes(nodes: VincisCanvasNode[], selectedNodeIds: string[]) {
  const selected = new Set(selectedNodeIds);
  const frames = new Map(
    nodes.filter((node) => node.type === "frame").map((node) => [node.id, node] as const)
  );
  const removeFrameIds = new Set(
    nodes.filter((node) => selected.has(node.id) && node.type === "frame").map((node) => node.id)
  );

  return applyCanvasNodeInteractionFlagsAll(
    nodes
      .filter((node) => !removeFrameIds.has(node.id))
      .map((node) => {
        if (!node.parentId || !selected.has(node.id)) return node;
        const parent = frames.get(node.parentId);
        if (!parent) {
          return { ...node, parentId: undefined, extent: undefined };
        }
        return {
          ...node,
          parentId: undefined,
          extent: undefined,
          position: {
            x: parent.position.x + node.position.x,
            y: parent.position.y + node.position.y
          }
        };
      })
  );
}

export function mergeSelectedMediaNodes(nodes: VincisCanvasNode[], selectedNodeIds: string[]) {
  const selected = selectedNodes(nodes, selectedNodeIds).filter((node) => isCanvasMediaNode(node));
  if (selected.length < 2) return null;

  const sorted = [...selected].sort((a, b) => nodeZIndex(b) - nodeZIndex(a));
  const primary = sorted[0];
  const removeIds = new Set(sorted.slice(1).map((node) => node.id));
  const minX = Math.min(...selected.map((node) => node.position.x));
  const minY = Math.min(...selected.map((node) => node.position.y));
  const maxX = Math.max(
    ...selected.map((node) => node.position.x + nodeSize(node).width)
  );
  const maxY = Math.max(
    ...selected.map((node) => node.position.y + nodeSize(node).height)
  );

  const merged = applyCanvasNodeInteractionFlags({
    ...primary,
    position: { x: minX, y: minY },
    width: maxX - minX,
    height: maxY - minY,
    selected: true,
    data: {
      ...primary.data,
      title: primary.data.title || "Merged layer"
    }
  });

  return {
    nodes: [
      ...nodes
        .filter((node) => !removeIds.has(node.id) && node.id !== primary.id)
        .map((node) => ({ ...node, selected: false })),
      merged
    ],
    selectedNodeIds: [primary.id]
  };
}

export function autoLayoutSelectedNodes(
  nodes: VincisCanvasNode[],
  edges: VincisCanvasEdge[],
  selectedNodeIds: string[]
) {
  const selected = new Set(selectedNodeIds);
  if (selected.size < 2) return nodes;
  const subset = nodes.filter((node) => selected.has(node.id));
  const subsetIds = new Set(subset.map((node) => node.id));
  const subsetEdges = edges.filter(
    (edge) => subsetIds.has(edge.source) && subsetIds.has(edge.target)
  );
  const laidOut = autoLayoutCanvas(subset, subsetEdges);
  const positions = new Map(laidOut.map((node) => [node.id, node.position] as const));
  return nodes.map((node) =>
    positions.has(node.id) ? { ...node, position: positions.get(node.id)! } : node
  );
}

export function toggleSelectedNodeFlag(
  nodes: VincisCanvasNode[],
  selectedNodeIds: string[],
  flag: "locked" | "hidden"
) {
  const selected = new Set(selectedNodeIds);
  if (!selected.size) return nodes;
  const targetNodes = nodes.filter((node) => selected.has(node.id));
  const nextValue = !targetNodes.every((node) => node.data[flag] === true);
  return applyCanvasNodeInteractionFlagsAll(
    nodes.map((node) =>
      selected.has(node.id)
        ? {
            ...node,
            data: { ...node.data, [flag]: nextValue }
          }
        : node
    )
  );
}

export function alignSelectedNodes(nodes: VincisCanvasNode[], selectedNodeIds: string[]) {
  const selected = new Set(selectedNodeIds);
  const anchor = nodes.find((node) => selected.has(node.id));
  if (!anchor || selected.size < 2) return null;
  return nodes.map((node) =>
    selected.has(node.id) ? { ...node, position: { ...node.position, y: anchor.position.y } } : node
  );
}

export function sortSelectedNodes(nodes: VincisCanvasNode[], selectedNodeIds: string[]) {
  const selectedNodes = nodes
    .filter((node) => selectedNodeIds.includes(node.id))
    .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
  if (selectedNodes.length < 2) return null;
  const startX = Math.min(...selectedNodes.map((node) => node.position.x));
  const anchorY = selectedNodes[0].position.y;
  const positions = new Map(
    selectedNodes.map((node, index) => [node.id, { x: startX + index * 350, y: anchorY }] as const)
  );
  return nodes.map((node) =>
    positions.has(node.id) ? { ...node, position: positions.get(node.id)! } : node
  );
}

export function groupSelectedInFrame(nodes: VincisCanvasNode[], selectedNodeIds: string[]) {
  const selected = nodes.filter(
    (node) => selectedNodeIds.includes(node.id) && !node.parentId && node.type !== "frame"
  );
  if (!selected.length) return null;
  const minX = Math.min(...selected.map((node) => node.position.x));
  const minY = Math.min(...selected.map((node) => node.position.y));
  const maxX = Math.max(
    ...selected.map((node) => node.position.x + nodeSize(node).width)
  );
  const maxY = Math.max(
    ...selected.map((node) => node.position.y + nodeSize(node).height)
  );
  const frameId = `frame_${crypto.randomUUID()}`;
  const framePosition = { x: minX - 40, y: minY - 70 };
  const frame: VincisCanvasNode = {
    id: frameId,
    type: "frame",
    position: framePosition,
    width: maxX - minX + 80,
    height: maxY - minY + 110,
    zIndex: -20,
    data: { title: "Frame", status: "ready" }
  };
  const selectedIds = new Set(selected.map((node) => node.id));
  return {
    nodes: [
      frame,
      ...nodes.map((node) =>
        selectedIds.has(node.id)
          ? {
              ...node,
              parentId: frameId,
              extent: "parent" as const,
              position: {
                x: node.position.x - framePosition.x,
                y: node.position.y - framePosition.y
              }
            }
          : node
      )
    ],
    selectedNodeIds: [frameId]
  };
}

export function isTerminalGenerationJobStatus(status: GenerationJobEvent["status"]) {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELLED";
}

export function shouldApplyGenerationJobEvent(
  nodes: VincisCanvasNode[],
  event: GenerationJobEvent
) {
  if (!event.nodeId) return false;
  const node = nodes.find((item) => item.id === event.nodeId);
  if (!node) return false;

  if (!isTerminalGenerationJobStatus(event.status)) {
    if (node.data.status === "ready" || node.data.status === "failed") return false;
    return true;
  }

  if (event.status === "SUCCEEDED") {
    if (node.data.status === "ready") {
      if (event.outputAssetId && node.data.assetId === event.outputAssetId) return false;
      if (!event.outputAssetId && node.data.url) return false;
    }
  }

  if (event.status === "FAILED" || event.status === "CANCELLED") {
    if (node.data.status === "failed") return false;
  }

  return true;
}

export function applyGenerationJobEvent(nodes: VincisCanvasNode[], event: GenerationJobEvent) {
  if (!event.nodeId) return null;
  if (!shouldApplyGenerationJobEvent(nodes, event)) return null;
  const terminal = isTerminalGenerationJobStatus(event.status);
  const resolvedType =
    event.type === "IMAGE" ? "image" : event.type === "VIDEO" ? "video" : "music";
  return {
    terminal,
    nodes: nodes.map((node) =>
      node.id === event.nodeId
        ? {
            ...node,
            type: event.status === "SUCCEEDED" ? resolvedType : node.type,
            width:
              event.status === "SUCCEEDED" && resolvedType === "music"
                ? MUSIC_NODE_READY_CARD.width
                : node.width,
            height:
              event.status === "SUCCEEDED" && resolvedType === "music"
                ? MUSIC_NODE_READY_CARD.height
                : node.height,
            data: {
              ...node.data,
              progress: event.progress,
              status:
                event.status === "FAILED" || event.status === "CANCELLED"
                  ? "failed"
                  : event.status === "SUCCEEDED"
                    ? "ready"
                    : "loading",
              assetId: event.outputAssetId ?? node.data.assetId,
              url: event.outputAssetId
                ? `/api/canvas/assets/${event.outputAssetId}/preview`
                : node.data.url,
              error: event.errorMessage ?? undefined
            }
          }
        : node
    ) as VincisCanvasNode[]
  };
}

export function duplicateSelectedNodes(nodes: VincisCanvasNode[], selectedNodeIds: string[]) {
  const selected = new Set(selectedNodeIds);
  const copies = nodes
    .filter((node) => selected.has(node.id))
    .map((node) => ({
      ...node,
      id: `node_${crypto.randomUUID()}`,
      position: { x: node.position.x + 36, y: node.position.y + 36 },
      selected: true
    }));
  if (!copies.length) return null;
  return {
    nodes: applyCanvasNodeInteractionFlagsAll([
      ...nodes.map((node) => ({ ...node, selected: false })),
      ...copies
    ]),
    selectedNodeIds: copies.map((node) => node.id)
  };
}

export function pasteNodesAt(
  nodes: VincisCanvasNode[],
  selectedNodeIds: string[],
  clipboardNodes: VincisCanvasNode[],
  position: { x: number; y: number }
) {
  const source =
    clipboardNodes.length > 0
      ? clipboardNodes
      : nodes.filter((node) => selectedNodeIds.includes(node.id));
  if (!source.length) return null;

  const minX = Math.min(...source.map((node) => node.position.x));
  const minY = Math.min(...source.map((node) => node.position.y));
  const copies = source.map((node) => ({
    ...node,
    id: `node_${crypto.randomUUID()}`,
    position: {
      x: position.x + (node.position.x - minX),
      y: position.y + (node.position.y - minY)
    },
    selected: true
  }));

  return {
    nodes: applyCanvasNodeInteractionFlagsAll([
      ...nodes.map((node) => ({ ...node, selected: false })),
      ...copies
    ]),
    selectedNodeIds: copies.map((node) => node.id)
  };
}
