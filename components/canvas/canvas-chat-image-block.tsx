"use client";

import { Download, MoveRight } from "lucide-react";
import {
  dispatchChatImageAddToCanvas,
  resolveChatImageDownloadHref,
  writeChatImageDragData,
  type ChatImageCanvasPayload
} from "@/lib/canvas/chat-image-canvas";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CanvasChatImageBlock({
  locale,
  imageUrl,
  assetId,
  prompt
}: {
  locale: Locale;
  imageUrl: string;
  assetId?: string;
  prompt?: string;
}) {
  const payload: ChatImageCanvasPayload | null = assetId
    ? {
        assetId,
        url: imageUrl,
        fileName: "canvas-chat-image.png",
        mimeType: "image/png",
        prompt,
        title: locale === "zh" ? "对话生成图片" : "Chat image"
      }
    : null;
  const downloadHref = resolveChatImageDownloadHref({ assetId, imageUrl });

  return (
    <div className="mt-3 space-y-2">
      <div
        draggable={Boolean(payload)}
        onDragStart={(event) => {
          if (!payload) return;
          writeChatImageDragData(event.dataTransfer, payload);
        }}
        className={cn(
          "overflow-hidden rounded-xl ring-1 ring-zinc-200/80",
          payload ? "cursor-grab active:cursor-grabbing" : ""
        )}
      >
        <img
          src={imageUrl}
          alt={locale === "zh" ? "生成的图片" : "Generated image"}
          className="max-h-72 w-full object-cover"
          draggable={false}
        />
      </div>
      {payload ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => dispatchChatImageAddToCanvas(payload)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-zinc-800"
          >
            <MoveRight className="h-3.5 w-3.5" />
            {locale === "zh" ? "添加到画布" : "Add to canvas"}
          </button>
          {downloadHref ? (
            <a
              href={downloadHref}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <Download className="h-3.5 w-3.5" />
              {locale === "zh" ? "下载" : "Download"}
            </a>
          ) : null}
          <span className="text-[10px] text-zinc-400">
            {locale === "zh" ? "或拖拽图片到画布" : "Or drag onto canvas"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
