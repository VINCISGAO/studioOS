import type { VincisCanvasNode } from "@/lib/canvas/types";

export const VIDEO_CARD = {
  width: 450,
  height: 286,
  gapX: 48,
  gapY: 40
} as const;

export function countVideoGenerationLayouts(nodes: VincisCanvasNode[]) {
  return nodes.filter((node) => node.type === "video" && node.data.layoutKind === "VIDEO_GENERATION")
    .length;
}

export function createVideoGenerationLayout(input: {
  layoutIndex: number;
  position: { x: number; y: number };
  locale: "zh" | "en";
}): { slotNodeId: string; node: VincisCanvasNode } {
  const slotNodeId = `node_${crypto.randomUUID()}`;
  const layoutNumber = input.layoutIndex + 1;
  const title = input.locale === "zh" ? `视频 ${layoutNumber}` : `Video ${layoutNumber}`;
  const slotLabel = input.locale === "zh" ? "等待生成视频…" : "Waiting for video…";

  const node: VincisCanvasNode = {
    id: slotNodeId,
    type: "video",
    position: input.position,
    width: VIDEO_CARD.width,
    height: VIDEO_CARD.height,
    data: {
      title,
      status: "idle",
      prompt: slotLabel,
      layoutKind: "VIDEO_GENERATION",
      layoutIndex: layoutNumber
    }
  };

  return { slotNodeId, node };
}

export function isUneditedVideoGenerationSlot(node: VincisCanvasNode) {
  return (
    node.type === "video" &&
    node.data.layoutKind === "VIDEO_GENERATION" &&
    node.data.status === "idle" &&
    !node.data.url &&
    !node.data.jobId
  );
}
