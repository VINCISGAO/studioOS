import { applyCanvasNodeInteractionFlagsAll } from "@/lib/canvas/node-interaction";
import { dedupeUneditedGenerationSlots } from "@/lib/canvas/generation-slot-dedupe";
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
  const deduped = dedupeUneditedGenerationSlots(nodes);
  return applyCanvasNodeInteractionFlagsAll(
    deduped.map((node) => stripEphemeralNodeFields({ ...node, selected: false }))
  );
}

export { dedupeUneditedGenerationSlots } from "@/lib/canvas/generation-slot-dedupe";
