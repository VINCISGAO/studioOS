"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type CanvasContextMenuItem = {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  onSelect: () => void;
};

export function shortcutMod() {
  if (typeof navigator === "undefined") return "⌘";
  return /Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘" : "Ctrl";
}

export function CanvasContextMenuShell({
  x,
  y,
  sections,
  onClose
}: {
  x: number;
  y: number;
  sections: CanvasContextMenuItem[][];
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[240px] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl"
      style={{ left: x, top: y }}
      role="menu"
    >
      {sections.map((section, sectionIndex) => (
        <div key={`section-${sectionIndex}`}>
          {sectionIndex > 0 ? <div className="my-1 border-t border-zinc-100" /> : null}
          {section.map((item) => (
            <button
              key={item.id}
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
                  : item.destructive
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-zinc-800 hover:bg-zinc-50"
              )}
            >
              <span>{item.label}</span>
              {item.shortcut ? (
                <span className="text-xs tabular-nums text-zinc-400">{item.shortcut}</span>
              ) : null}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
