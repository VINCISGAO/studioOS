import type { CanvasNodeData } from "@/lib/canvas/types";

export function resolveCanvasNodeDownloadHref(data: CanvasNodeData): string | null {
  if (data.assetId) return `/api/assets/download/${data.assetId}`;
  const previewMatch = data.url?.match(/\/api\/canvas\/assets\/([0-9a-f-]{36})\/preview/i);
  if (previewMatch?.[1]) return `/api/assets/download/${previewMatch[1]}`;
  return null;
}

export function canDownloadCanvasNode(data: CanvasNodeData) {
  return Boolean(resolveCanvasNodeDownloadHref(data) || data.url);
}

export function triggerCanvasNodeDownload(data: CanvasNodeData) {
  const href = resolveCanvasNodeDownloadHref(data);
  const target = href ?? data.url;
  if (!target) return;

  const anchor = document.createElement("a");
  anchor.href = target;
  anchor.download = data.fileName?.trim() || "download";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
