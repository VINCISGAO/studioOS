import type { NodeProps } from "@xyflow/react";
import type { VincisCanvasNode } from "@/lib/canvas/types";

function nodeDataRenderKey(data: VincisCanvasNode["data"]) {
  return [
    data.status,
    data.url,
    data.progress,
    data.error,
    data.title,
    data.prompt,
    data.assetId,
    data.fileName,
    data.mimeType,
    data.text,
    data.locked,
    data.hidden,
    data.generationType
  ].join("\0");
}

export function canvasNodePropsAreEqual(
  prev: NodeProps<VincisCanvasNode>,
  next: NodeProps<VincisCanvasNode>
) {
  if (prev.id !== next.id) return false;
  if (prev.selected !== next.selected) return false;
  if (prev.width !== next.width) return false;
  if (prev.height !== next.height) return false;
  if (prev.type !== next.type) return false;
  return nodeDataRenderKey(prev.data) === nodeDataRenderKey(next.data);
}
