export type CanvasSendToChatPayload = {
  assetId: string;
  url: string;
  fileName: string;
};

export const CANVAS_SEND_TO_CHAT_EVENT = "canvas:send-to-chat";

export function dispatchCanvasSendToChat(payload: CanvasSendToChatPayload) {
  window.dispatchEvent(new CustomEvent(CANVAS_SEND_TO_CHAT_EVENT, { detail: payload }));
}

export function resolveCanvasNodeChatReference(data: {
  assetId?: string;
  url?: string;
  fileName?: string;
  title?: string;
}): CanvasSendToChatPayload | null {
  if (!data.assetId || !data.url) return null;
  return {
    assetId: data.assetId,
    url: data.url,
    fileName: data.fileName ?? data.title ?? "canvas-asset.png"
  };
}
