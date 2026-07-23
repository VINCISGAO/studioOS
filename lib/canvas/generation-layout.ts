import type { VincisCanvasNode } from "@/lib/canvas/types";

export type GenerationSlotKind = "image" | "video" | "music";

type LayoutKind = "IMAGE_GENERATION" | "VIDEO_GENERATION" | "MUSIC_GENERATION";

type SlotConfig = {
  layoutKind: LayoutKind;
  nodeType: "image" | "video" | "music";
  card: { width: number; height: number; gapY: number; centerOffsetY?: number };
  title: (index: number, locale: "zh" | "en") => string;
  placeholder: (locale: "zh" | "en") => string;
};

const SLOT_CONFIG: Record<GenerationSlotKind, SlotConfig> = {
  image: {
    layoutKind: "IMAGE_GENERATION",
    nodeType: "image",
    card: { width: 360, height: 240, gapY: 32 },
    title: (index, locale) => (locale === "zh" ? `图片 ${index}` : `Image ${index}`),
    placeholder: (locale) => (locale === "zh" ? "等待生成图片…" : "Waiting for image…")
  },
  video: {
    layoutKind: "VIDEO_GENERATION",
    nodeType: "video",
    card: { width: 450, height: 286, gapY: 40 },
    title: (index, locale) => (locale === "zh" ? `视频 ${index}` : `Video ${index}`),
    placeholder: (locale) => (locale === "zh" ? "等待生成视频…" : "Waiting for video…")
  },
  music: {
    layoutKind: "MUSIC_GENERATION",
    nodeType: "music",
    card: { width: 480, height: 168, gapY: 32 },
    title: (index, locale) => (locale === "zh" ? `音乐 ${index}` : `Music ${index}`),
    placeholder: (locale) => (locale === "zh" ? "等待生成音乐…" : "Waiting for music…")
  }
};

export const IMAGE_CARD = SLOT_CONFIG.image.card;
export const VIDEO_CARD = SLOT_CONFIG.video.card;
export const MUSIC_CARD = SLOT_CONFIG.music.card;

export function getGenerationCard(kind: GenerationSlotKind) {
  return SLOT_CONFIG[kind].card;
}

export function nextLayoutIndex(nodes: VincisCanvasNode[], kind: GenerationSlotKind) {
  const { layoutKind } = SLOT_CONFIG[kind];
  let maxIndex = 0;
  for (const node of nodes) {
    if (node.data.layoutKind !== layoutKind) continue;
    const index = node.data.layoutIndex;
    if (typeof index === "number" && index > maxIndex) {
      maxIndex = index;
    }
  }
  return maxIndex;
}

export function createGenerationSlot(input: {
  kind: GenerationSlotKind;
  layoutIndex: number;
  position: { x: number; y: number };
  locale: "zh" | "en";
}): { slotNodeId: string; node: VincisCanvasNode } {
  const config = SLOT_CONFIG[input.kind];
  const slotNodeId = `node_${crypto.randomUUID()}`;
  const layoutNumber = input.layoutIndex + 1;

  const node: VincisCanvasNode = {
    id: slotNodeId,
    type: config.nodeType,
    position: input.position,
    width: config.card.width,
    height: config.card.height,
    data: {
      title: config.title(layoutNumber, input.locale),
      status: "idle",
      prompt: config.placeholder(input.locale),
      layoutKind: config.layoutKind,
      layoutIndex: layoutNumber
    }
  };

  return { slotNodeId, node };
}

export function isUneditedGenerationSlot(node: VincisCanvasNode, kind: GenerationSlotKind) {
  const config = SLOT_CONFIG[kind];
  return (
    node.type === config.nodeType &&
    node.data.layoutKind === config.layoutKind &&
    node.data.status === "idle" &&
    !node.data.url &&
    !node.data.jobId
  );
}

export function nextImageLayoutIndex(nodes: VincisCanvasNode[]) {
  return nextLayoutIndex(nodes, "image");
}

export function nextVideoLayoutIndex(nodes: VincisCanvasNode[]) {
  return nextLayoutIndex(nodes, "video");
}

export function nextMusicLayoutIndex(nodes: VincisCanvasNode[]) {
  return nextLayoutIndex(nodes, "music");
}

export function createImageGenerationLayout(input: {
  layoutIndex: number;
  position: { x: number; y: number };
  locale: "zh" | "en";
}) {
  return createGenerationSlot({ kind: "image", ...input });
}

export function createVideoGenerationLayout(input: {
  layoutIndex: number;
  position: { x: number; y: number };
  locale: "zh" | "en";
}) {
  return createGenerationSlot({ kind: "video", ...input });
}

export function createMusicGenerationLayout(input: {
  layoutIndex: number;
  position: { x: number; y: number };
  locale: "zh" | "en";
}) {
  return createGenerationSlot({ kind: "music", ...input });
}

export function isUneditedImageGenerationSlot(node: VincisCanvasNode) {
  return isUneditedGenerationSlot(node, "image");
}

export function isUneditedVideoGenerationSlot(node: VincisCanvasNode) {
  return isUneditedGenerationSlot(node, "video");
}

export function isUneditedMusicGenerationSlot(node: VincisCanvasNode) {
  return isUneditedGenerationSlot(node, "music");
}
