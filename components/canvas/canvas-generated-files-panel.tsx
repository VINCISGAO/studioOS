"use client";

import { Download, FileImage } from "lucide-react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import {
  canDownloadCanvasNode,
  resolveCanvasNodeDownloadHref
} from "@/lib/canvas/node-download";
import type { VincisCanvasNode } from "@/lib/canvas/types";
import type { Locale } from "@/lib/i18n";

function fileLabel(node: VincisCanvasNode) {
  return node.data.fileName ?? node.data.title ?? node.id;
}

export function CanvasGeneratedFilesPanel({ locale }: { locale: Locale }) {
  const nodes = useCanvasStore((state) => state.nodes);
  const files = nodes.filter(
    (node) =>
      node.data.status === "ready" &&
      (node.data.url || node.data.assetId) &&
      node.type !== "text" &&
      node.type !== "frame"
  );

  return (
    <div className="w-[320px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
      <div className="border-b border-zinc-100 px-3 py-2.5">
        <div className="text-sm font-medium text-zinc-900">
          {locale === "zh" ? "已生成文件列表" : "Generated files"}
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {files.length ? (
          files.map((node) => {
            const href = resolveCanvasNodeDownloadHref(node.data);
            const downloadable = canDownloadCanvasNode(node.data) && href;
            return (
              <div
                key={node.id}
                className="flex items-center gap-2.5 border-b border-zinc-50 px-3 py-2 last:border-b-0"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                  {node.data.url && node.type !== "music" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={node.data.url}
                      alt={fileLabel(node)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-400">
                      <FileImage className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-xs text-zinc-700">
                  <div className="truncate">{fileLabel(node)}</div>
                </div>
                {downloadable ? (
                  <a
                    href={href}
                    download
                    className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                    aria-label={locale === "zh" ? "下载" : "Download"}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="shrink-0 px-1.5 text-[10px] text-zinc-300">—</span>
                )}
              </div>
            );
          })
        ) : (
          <div className="px-3 py-8 text-center text-xs text-zinc-400">
            {locale === "zh" ? "暂无已生成文件" : "No generated files yet"}
          </div>
        )}
      </div>
    </div>
  );
}
