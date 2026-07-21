"use client";

import { useReactFlow } from "@xyflow/react";
import {
  Frame,
  ImageIcon,
  Music2,
  Type,
  Upload,
  Video
} from "lucide-react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import type { CanvasNodeType, VincisCanvasNode } from "@/lib/canvas/types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const icons: Record<CanvasNodeType, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  music: Music2,
  text: Type,
  frame: Frame,
  upload: Upload,
  loading: Upload
};

export function CanvasLayersPanel({ locale }: { locale: Locale }) {
  const nodes = useCanvasStore((state) => state.nodes);
  const selectedNodeIds = useCanvasStore((state) => state.selectedNodeIds);
  const onNodesChange = useCanvasStore((state) => state.onNodesChange);
  const { setCenter } = useReactFlow();

  const layers = [...nodes].sort(
    (a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0) || a.data.title.localeCompare(b.data.title)
  );

  function focusNode(node: VincisCanvasNode) {
    onNodesChange(
      nodes.map((item) => ({
        id: item.id,
        type: "select",
        selected: item.id === node.id
      }))
    );
    const width = node.width ?? 320;
    const height = node.height ?? 220;
    setCenter(node.position.x + width / 2, node.position.y + height / 2, {
      zoom: 0.9,
      duration: 220
    });
  }

  return (
    <div className="w-[280px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
      <div className="border-b border-zinc-100 px-3 py-2.5">
        <div className="text-sm font-medium text-zinc-900">
          {locale === "zh" ? "图层" : "Layers"}
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto p-1.5">
        {layers.length ? (
          layers.map((node) => {
            const Icon = icons[node.type];
            const active = selectedNodeIds.includes(node.id);
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => focusNode(node)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition",
                  active ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{node.data.title}</span>
              </button>
            );
          })
        ) : (
          <div className="px-2 py-8 text-center text-xs text-zinc-400">
            {locale === "zh" ? "暂无图层" : "No layers yet"}
          </div>
        )}
      </div>
    </div>
  );
}
