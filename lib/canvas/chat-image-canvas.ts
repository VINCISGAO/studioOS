import type { VincisCanvasNode } from "@/lib/canvas/types";

export const CHAT_IMAGE_NODE_WIDTH = 320;
export const CHAT_IMAGE_NODE_HEIGHT = 320;
export const CHAT_IMAGE_DRAG_MIME = "application/vnd.vincis.canvas-chat-image+json";

export type ChatImageCanvasPayload = {
  assetId: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  prompt?: string;
  title?: string;
};

export function buildChatImageCanvasNode(
  payload: ChatImageCanvasPayload,
  center: { x: number; y: number }
): VincisCanvasNode {
  return {
    id: `node_${crypto.randomUUID()}`,
    type: "image",
    position: {
      x: center.x - CHAT_IMAGE_NODE_WIDTH / 2,
      y: center.y - CHAT_IMAGE_NODE_HEIGHT / 2
    },
    width: CHAT_IMAGE_NODE_WIDTH,
    height: CHAT_IMAGE_NODE_HEIGHT,
    data: {
      title: payload.title ?? payload.fileName ?? "Chat image",
      status: "ready",
      progress: 100,
      url: payload.url,
      assetId: payload.assetId,
      fileName: payload.fileName ?? "canvas-chat-image.png",
      mimeType: payload.mimeType ?? "image/png",
      generationType: "IMAGE",
      prompt: payload.prompt
    }
  };
}

export function resolveChatImageDownloadHref(input: {
  assetId?: string;
  imageUrl?: string;
}): string | null {
  if (input.assetId) return `/api/assets/download/${input.assetId}`;
  const previewMatch = input.imageUrl?.match(/\/api\/canvas\/assets\/([0-9a-f-]{36})\/preview/i);
  if (previewMatch?.[1]) return `/api/assets/download/${previewMatch[1]}`;
  return null;
}

export function writeChatImageDragData(
  dataTransfer: DataTransfer,
  payload: ChatImageCanvasPayload
) {
  const encoded = JSON.stringify(payload);
  dataTransfer.setData(CHAT_IMAGE_DRAG_MIME, encoded);
  dataTransfer.setData("text/plain", encoded);
  dataTransfer.effectAllowed = "copy";
}

export function isChatImageDragEvent(dataTransfer: DataTransfer) {
  return (
    dataTransfer.types.includes(CHAT_IMAGE_DRAG_MIME) ||
    dataTransfer.types.includes("text/plain")
  );
}

export function readChatImageDragData(
  dataTransfer: DataTransfer
): ChatImageCanvasPayload | null {
  const raw =
    dataTransfer.getData(CHAT_IMAGE_DRAG_MIME) || dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ChatImageCanvasPayload;
    if (typeof parsed.assetId === "string" && typeof parsed.url === "string") {
      return parsed;
    }
  } catch {
    // ignore invalid drag payload
  }
  return null;
}

export function dispatchChatImageAddToCanvas(payload: ChatImageCanvasPayload) {
  window.dispatchEvent(new CustomEvent("canvas:chat-image-add", { detail: payload }));
}
