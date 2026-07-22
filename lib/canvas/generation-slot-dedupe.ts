import {
  isUneditedImageGenerationSlot,
  isUneditedMusicGenerationSlot,
  isUneditedVideoGenerationSlot
} from "@/lib/canvas/generation-layout";
import type { VincisCanvasNode } from "@/lib/canvas/types";

export function isUneditedGenerationSlot(node: VincisCanvasNode) {
  return (
    isUneditedVideoGenerationSlot(node) ||
    isUneditedImageGenerationSlot(node) ||
    isUneditedMusicGenerationSlot(node)
  );
}

export function dedupeUneditedGenerationSlots(nodes: VincisCanvasNode[]) {
  const seenKeys = new Set<string>();

  return nodes.filter((node) => {
    if (!isUneditedGenerationSlot(node)) return true;

    const layoutKind = node.data.layoutKind ?? "UNKNOWN";
    const positionKey = `${layoutKind}:${Math.round(node.position.x / 8)}:${Math.round(node.position.y / 8)}`;
    if (seenKeys.has(positionKey)) return false;
    seenKeys.add(positionKey);

    const layoutIndex = node.data.layoutIndex;
    if (typeof layoutIndex === "number") {
      const indexKey = `${layoutKind}:index:${layoutIndex}`;
      if (seenKeys.has(indexKey)) return false;
      seenKeys.add(indexKey);
    }

    return true;
  });
}
