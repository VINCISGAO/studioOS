import { applyCanvasNodeInteractionFlagsAll } from "@/lib/canvas/node-interaction";
import { isUneditedVideoGenerationSlot } from "@/lib/canvas/video-layout";
import type { VincisCanvasNode } from "@/lib/canvas/types";

function stripEphemeralNodeFields(node: VincisCanvasNode): VincisCanvasNode {
  const {
    selected: _selected,
    dragging: _dragging,
    draggable: _draggable,
    selectable: _selectable,
    hidden: _hidden,
    measured: _measured,
    ...rest
  } = node;
  return rest as VincisCanvasNode;
}

export function sanitizeLoadedCanvasNodes(nodes: VincisCanvasNode[]) {
  const deduped = dedupeUneditedVideoGenerationSlots(nodes);
  return applyCanvasNodeInteractionFlagsAll(
    deduped.map((node) => stripEphemeralNodeFields({ ...node, selected: false }))
  );
}

export function dedupeUneditedVideoGenerationSlots(nodes: VincisCanvasNode[]) {
  const seenLayoutIndexes = new Set<number>();
  const seenTitles = new Set<string>();

  return nodes.filter((node) => {
    if (!isUneditedVideoGenerationSlot(node)) return true;

    const layoutIndex = node.data.layoutIndex;
    if (typeof layoutIndex === "number") {
      if (seenLayoutIndexes.has(layoutIndex)) return false;
      seenLayoutIndexes.add(layoutIndex);
      return true;
    }

    const title = node.data.title;
    if (typeof title === "string" && seenTitles.has(title)) return false;
    if (typeof title === "string") seenTitles.add(title);
    return true;
  });
}
