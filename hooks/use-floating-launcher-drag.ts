"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  FLOATING_LAUNCHER_CLICK_THRESHOLD,
  FLOATING_LAUNCHER_STORAGE_KEY,
  normalizeLauncherPosition,
  readStoredLauncherPosition,
  storeLauncherPosition,
  type FloatingLauncherPosition
} from "@/lib/lucien/floating-launcher-position";

type FloatingLauncherDrag = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  moved: boolean;
};

export function useFloatingLauncherDrag(options?: {
  storageKey?: string;
  onTap?: () => void;
}) {
  const storageKey = options?.storageKey ?? FLOATING_LAUNCHER_STORAGE_KEY;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const launcherDragRef = useRef<FloatingLauncherDrag | null>(null);
  const suppressLauncherClickRef = useRef(false);
  const [launcherPosition, setLauncherPosition] = useState<FloatingLauncherPosition>(() =>
    readStoredLauncherPosition(storageKey)
  );
  const [isLauncherDragging, setIsLauncherDragging] = useState(false);

  useEffect(() => {
    setLauncherPosition(readStoredLauncherPosition(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const handleResize = () => {
      setLauncherPosition((current) => {
        const next = normalizeLauncherPosition(current);
        storeLauncherPosition(next, storageKey);
        return next;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [storageKey]);

  function startLauncherDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    button.setPointerCapture(event.pointerId);

    const drag: FloatingLauncherDrag = {
      pointerId: event.pointerId,
      offsetX,
      offsetY,
      startX: event.clientX,
      startY: event.clientY,
      lastX: rect.left,
      lastY: rect.top,
      moved: false
    };
    launcherDragRef.current = drag;
    setIsLauncherDragging(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const current = launcherDragRef.current;
      if (!current || moveEvent.pointerId !== current.pointerId) return;

      const next = normalizeLauncherPosition({
        x: moveEvent.clientX - current.offsetX,
        y: moveEvent.clientY - current.offsetY
      });
      const moved =
        current.moved ||
        Math.hypot(moveEvent.clientX - current.startX, moveEvent.clientY - current.startY) >
          FLOATING_LAUNCHER_CLICK_THRESHOLD;

      launcherDragRef.current = { ...current, lastX: next.x, lastY: next.y, moved };
      setLauncherPosition(next);
    };

    const finishDrag = (endEvent: PointerEvent) => {
      const current = launcherDragRef.current;
      if (!current || endEvent.pointerId !== current.pointerId) return;

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);

      const buttonNode = buttonRef.current;
      if (buttonNode?.hasPointerCapture(endEvent.pointerId)) {
        buttonNode.releasePointerCapture(endEvent.pointerId);
      }

      const next = normalizeLauncherPosition({ x: current.lastX, y: current.lastY });
      setLauncherPosition(next);
      storeLauncherPosition(next, storageKey);
      setIsLauncherDragging(false);
      suppressLauncherClickRef.current = current.moved;
      launcherDragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
  }

  function handleLauncherClick() {
    if (suppressLauncherClickRef.current) {
      suppressLauncherClickRef.current = false;
      return;
    }
    options?.onTap?.();
  }

  return {
    buttonRef,
    launcherStyle: {
      left: `${launcherPosition.x}px`,
      top: `${launcherPosition.y}px`
    },
    isLauncherDragging,
    startLauncherDrag,
    handleLauncherClick
  };
}
