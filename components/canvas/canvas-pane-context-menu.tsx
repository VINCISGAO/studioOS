"use client";

import {
  CanvasContextMenuShell,
  shortcutMod
} from "@/components/canvas/canvas-context-menu-shell";

export function CanvasPaneContextMenu({
  x,
  y,
  canPaste,
  onClose,
  onPaste,
  onZoomIn,
  onZoomOut,
  onFitView,
  onZoom100
}: {
  x: number;
  y: number;
  canPaste: boolean;
  onClose: () => void;
  onPaste: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onZoom100: () => void;
}) {
  const mod = shortcutMod();

  return (
    <CanvasContextMenuShell
      x={x}
      y={y}
      onClose={onClose}
      sections={[
        [
          {
            id: "paste",
            label: "粘贴",
            shortcut: `${mod}V`,
            disabled: !canPaste,
            onSelect: onPaste
          }
        ],
        [
          { id: "zoom-in", label: "放大", shortcut: `${mod}+`, onSelect: onZoomIn },
          { id: "zoom-out", label: "缩小", shortcut: `${mod}-`, onSelect: onZoomOut },
          {
            id: "fit-view",
            label: "显示画布所有元素",
            shortcut: "⇧1",
            onSelect: onFitView
          },
          {
            id: "zoom-100",
            label: "缩放至 100%",
            shortcut: `${mod}0`,
            onSelect: onZoom100
          }
        ]
      ]}
    />
  );
}
