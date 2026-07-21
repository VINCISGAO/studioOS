"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type MenuItem = {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onSelect: () => void;
};

function shortcutMod() {
  if (typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘" : "Ctrl";
}

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
  const menuRef = useRef<HTMLDivElement>(null);
  const mod = shortcutMod();

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const items: MenuItem[] = [
    {
      id: "paste",
      label: "粘贴",
      shortcut: `${mod}V`,
      disabled: !canPaste,
      onSelect: onPaste
    },
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
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[220px] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item, index) => (
        <div key={item.id}>
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onSelect();
              onClose();
            }}
            className={cn(
              "flex w-full items-center justify-between gap-6 px-3.5 py-2 text-left text-sm transition",
              item.disabled
                ? "cursor-not-allowed text-zinc-300"
                : "text-zinc-800 hover:bg-zinc-50"
            )}
          >
            <span>{item.label}</span>
            {item.shortcut ? (
              <span className="text-xs tabular-nums text-zinc-400">{item.shortcut}</span>
            ) : null}
          </button>
          {index === 0 ? <div className="my-1 border-t border-zinc-100" /> : null}
        </div>
      ))}
    </div>
  );
}
