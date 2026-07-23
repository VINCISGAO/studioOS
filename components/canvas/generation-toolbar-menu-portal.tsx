"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBodyPortalReady } from "@/components/canvas/hooks/use-body-portal-ready";
import { CANVAS_GENERATION_MODAL_Z_INDEX } from "@/lib/canvas/generation-ui";

const MENU_GAP = 8;

type MenuAlign = "start" | "center" | "end";

function computeMenuPosition(rect: DOMRect, menuWidth: number, align: MenuAlign) {
  const margin = 12;
  let left =
    align === "start"
      ? rect.left
      : align === "end"
        ? rect.right - menuWidth
        : rect.left + rect.width / 2 - menuWidth / 2;

  left = Math.min(Math.max(left, margin), window.innerWidth - menuWidth - margin);

  return {
    left,
    top: rect.top - MENU_GAP,
    transform: "translateY(-100%)"
  };
}

export function GenerationToolbarMenuPortal({
  open,
  anchorRef,
  menuWidth,
  align = "start",
  onClose,
  children
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  menuWidth: number;
  align?: MenuAlign;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const portalReady = useBodyPortalReady();
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    transform: string;
  } | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    setPosition(computeMenuPosition(anchor.getBoundingClientRect(), menuWidth, align));
  }, [align, anchorRef, menuWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (anchorRef.current?.contains(target)) return;
      const menuRoot = document.getElementById("generation-toolbar-menu-portal-root");
      if (menuRoot?.contains(target)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, onClose, open, updatePosition]);

  if (!open || !portalReady || !position) return null;

  return createPortal(
    <div
      id="generation-toolbar-menu-portal-root"
      className="fixed"
      style={{
        left: position.left,
        top: position.top,
        transform: position.transform,
        width: menuWidth,
        zIndex: CANVAS_GENERATION_MODAL_Z_INDEX + 2
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
