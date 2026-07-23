"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { GenerationReferenceSourceMenu } from "@/components/canvas/generation-reference-source-menu";
import { useBodyPortalReady } from "@/components/canvas/hooks/use-body-portal-ready";
import { CANVAS_GENERATION_MODAL_Z_INDEX } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";

const MENU_WIDTH = 224;
const MENU_GAP = 8;

type MenuAlign = "start" | "center" | "end";

function computeMenuPosition(rect: DOMRect, align: MenuAlign) {
  const margin = 12;
  let left =
    align === "start"
      ? rect.left
      : align === "end"
        ? rect.right - MENU_WIDTH
        : rect.left + rect.width / 2 - MENU_WIDTH / 2;

  left = Math.min(Math.max(left, margin), window.innerWidth - MENU_WIDTH - margin);

  const top = rect.bottom + MENU_GAP;
  return { left, top };
}

export function GenerationReferenceSourcePopover({
  locale,
  slot,
  open,
  align,
  anchorRef,
  onLocalUpload,
  onOpenLibrary,
  onOpenCanvasPicker,
  onClose
}: {
  locale: Locale;
  slot: GenerationReferenceSlot;
  open: boolean;
  align: MenuAlign;
  anchorRef: React.RefObject<HTMLElement | null>;
  onLocalUpload: () => void;
  onOpenLibrary: () => void;
  onOpenCanvasPicker: () => void;
  onClose: () => void;
}) {
  const portalReady = useBodyPortalReady();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    setPosition(computeMenuPosition(anchor.getBoundingClientRect(), align));
  }, [align, anchorRef]);

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
      className="fixed w-56"
      style={{
        left: position.left,
        top: position.top,
        zIndex: CANVAS_GENERATION_MODAL_Z_INDEX + 1
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <GenerationReferenceSourceMenu
        locale={locale}
        slot={slot}
        onLocalUpload={onLocalUpload}
        onOpenLibrary={onOpenLibrary}
        onOpenCanvasPicker={onOpenCanvasPicker}
        onActionComplete={onClose}
      />
    </div>,
    document.body
  );
}
