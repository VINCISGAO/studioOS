"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Hand, MousePointer2 } from "lucide-react";
import { useCanvasStore, type CanvasInteractionMode } from "@/components/canvas/canvas-store";
import { cn } from "@/lib/utils";

const tools = [
  { id: "select" as const, label: "选择", shortcut: "V", Icon: MousePointer2 },
  { id: "move" as const, label: "移动", shortcut: "H", Icon: Hand }
];

type MenuAnchor = {
  left: number;
  bottom: number;
};

export function CanvasInteractionToolPicker() {
  const mode = useCanvasStore((state) => state.interactionMode);
  const setInteractionMode = useCanvasStore((state) => state.setInteractionMode);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = tools.find((tool) => tool.id === mode) ?? tools[0];

  useLayoutEffect(() => {
    if (!open) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchor({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function choose(next: CanvasInteractionMode) {
    setInteractionMode(next);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={`${current.label} (${current.shortcut})`}
        aria-label={current.label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
          "bg-zinc-900 text-white"
        )}
      >
        <current.Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </button>
      {open && anchor
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[120] w-44 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl"
              style={{ left: anchor.left, bottom: anchor.bottom }}
              role="menu"
            >
              {tools.map(({ id, label, shortcut, Icon }) => {
                const active = mode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="menuitem"
                    onClick={() => choose(id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition",
                      active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-zinc-600" />
                    <span className="flex-1">{label}</span>
                    <span className="text-xs text-zinc-400">{shortcut}</span>
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
