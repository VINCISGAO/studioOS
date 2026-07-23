"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBodyPortalReady } from "@/components/canvas/hooks/use-body-portal-ready";
import type { GenerationReference } from "@/lib/canvas/generation-ui";
import { CANVAS_GENERATION_MODAL_Z_INDEX } from "@/lib/canvas/generation-ui";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import type { Locale } from "@/lib/i18n";

type ReferenceSlot = "video" | "image" | "audio";

function matchesReferenceSlot(node: VincisCanvasNode, slot: ReferenceSlot) {
  const mime = node.data.mimeType ?? "";
  if (slot === "image") {
    return node.type === "image" || mime.startsWith("image/");
  }
  if (slot === "video") {
    return (
      node.type === "video" ||
      node.type === "image" ||
      mime.startsWith("video/") ||
      mime.startsWith("image/")
    );
  }
  return node.type === "music" || mime.startsWith("audio/");
}

const copy = {
  zh: {
    title: "选择画布素材",
    empty: "画布上还没有可用的图片或视频节点。"
  },
  en: {
    title: "Pick canvas asset",
    empty: "No image or video nodes on the canvas yet."
  }
} as const;

export function GenerationCanvasPickerModal({
  locale,
  open,
  nodes,
  filterSlot = "video",
  onClose,
  onSelect
}: {
  locale: Locale;
  open: boolean;
  nodes: VincisCanvasNode[];
  filterSlot?: ReferenceSlot;
  onClose: () => void;
  onSelect: (reference: GenerationReference) => void;
}) {
  const portalReady = useBodyPortalReady();
  if (!open || !portalReady) return null;
  const t = copy[locale];
  const canvasAssets = nodes.filter(
    (node) =>
      (node.type === "image" || node.type === "video" || node.type === "music" || node.type === "upload") &&
      node.data.url &&
      node.data.status === "ready" &&
      matchesReferenceSlot(node, filterSlot)
  );

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/35 p-4"
      style={{ zIndex: CANVAS_GENERATION_MODAL_Z_INDEX }}
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div className="w-full max-w-[640px] rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-950">{t.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {canvasAssets.length ? (
          <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {canvasAssets.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  onSelect({
                    url: node.data.url!,
                    assetId: node.data.assetId,
                    fileName: node.data.fileName ?? node.data.title,
                    mimeType: node.data.mimeType,
                    source: "canvas",
                    nodeId: node.id
                  });
                  onClose();
                }}
                className="overflow-hidden rounded-2xl border border-zinc-200 text-left hover:border-zinc-400"
              >
                <div className="aspect-[4/3] bg-zinc-100">
                  {node.data.mimeType?.startsWith("video/") || node.type === "video" ? (
                    <video src={node.data.url} className="h-full w-full object-cover" muted playsInline />
                  ) : node.data.mimeType?.startsWith("audio/") || node.type === "music" ? (
                    <div className="flex h-full items-center justify-center bg-zinc-900 text-xs text-white/70">
                      Audio
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={node.data.url} alt={node.data.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="truncate px-3 py-2 text-xs text-zinc-700">{node.data.title}</div>
              </button>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">{t.empty}</p>
        )}
      </div>
    </div>,
    document.body
  );
}
