"use client";

import { useState } from "react";
import {
  Circle,
  FileSearch,
  Layers3,
  Map
} from "lucide-react";
import { CanvasBackgroundColorPicker } from "@/components/canvas/canvas-background-color-picker";
import { CanvasGeneratedFilesPanel } from "@/components/canvas/canvas-generated-files-panel";
import { CanvasLayersPanel } from "@/components/canvas/canvas-layers-panel";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type DockPanel = "background" | "layers" | "files" | null;

export function CanvasNavigatorDock({
  locale,
  showMinimap,
  onToggleMinimap
}: {
  locale: Locale;
  showMinimap: boolean;
  onToggleMinimap: () => void;
}) {
  const viewport = useCanvasStore((state) => state.viewport);
  const canvasBackgroundColor = useCanvasStore((state) => state.canvasBackgroundColor);
  const setCanvasBackgroundColor = useCanvasStore((state) => state.setCanvasBackgroundColor);
  const [panel, setPanel] = useState<DockPanel>(null);

  const zoomLabel = `${Math.round(viewport.zoom * 100)}%`;

  function togglePanel(next: DockPanel) {
    setPanel((current) => (current === next ? null : next));
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {panel ? (
        <div className="pointer-events-auto">
          {panel === "background" ? (
            <CanvasBackgroundColorPicker
              locale={locale}
              color={canvasBackgroundColor}
              onChange={setCanvasBackgroundColor}
              onClose={() => setPanel(null)}
            />
          ) : null}
          {panel === "layers" ? <CanvasLayersPanel locale={locale} /> : null}
          {panel === "files" ? <CanvasGeneratedFilesPanel locale={locale} /> : null}
        </div>
      ) : null}

      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-zinc-200/80 bg-white/95 px-1.5 py-1 shadow-md backdrop-blur-sm">
        <DockButton
          active={panel === "background"}
          title={locale === "zh" ? "画布背景色" : "Canvas background"}
          onClick={() => togglePanel("background")}
        >
          <Circle className="h-3.5 w-3.5" />
        </DockButton>
        <DockButton
          active={panel === "layers"}
          title={locale === "zh" ? "图层" : "Layers"}
          onClick={() => togglePanel("layers")}
        >
          <Layers3 className="h-3.5 w-3.5" />
        </DockButton>
        <DockButton
          active={panel === "files"}
          title={locale === "zh" ? "已生成文件列表" : "Generated files"}
          onClick={() => togglePanel("files")}
        >
          <FileSearch className="h-3.5 w-3.5" />
        </DockButton>
        <DockButton
          active={showMinimap}
          title={locale === "zh" ? "导航预览" : "Navigator"}
          onClick={onToggleMinimap}
        >
          <Map className="h-3.5 w-3.5" />
        </DockButton>
        <span className="mx-1 h-4 w-px bg-zinc-200" />
        <span className="min-w-[2.5rem] px-1 text-center text-[11px] tabular-nums text-zinc-500">
          {zoomLabel}
        </span>
      </div>
    </div>
  );
}

function DockButton({
  active,
  title,
  onClick,
  children
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full transition",
        active ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
      )}
    >
      {children}
    </button>
  );
}
