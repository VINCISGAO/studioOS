"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/components/canvas/canvas-store";

export function useCanvasViewportActions() {
  const { zoomIn, zoomOut, fitView, setViewport, getViewport } = useReactFlow();
  const syncViewport = useCanvasStore((state) => state.setViewport);

  const applyViewport = useCallback(
    (next: { x: number; y: number; zoom: number }) => {
      setViewport(next);
      syncViewport(next);
    },
    [setViewport, syncViewport]
  );

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 120 });
    requestAnimationFrame(() => {
      applyViewport(getViewport());
    });
  }, [applyViewport, getViewport, zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 120 });
    requestAnimationFrame(() => {
      applyViewport(getViewport());
    });
  }, [applyViewport, getViewport, zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.18, duration: 180 });
    window.setTimeout(() => {
      applyViewport(getViewport());
    }, 190);
  }, [applyViewport, fitView, getViewport]);

  const handleZoom100 = useCallback(() => {
    const current = getViewport();
    applyViewport({ x: current.x, y: current.y, zoom: 1 });
  }, [applyViewport, getViewport]);

  return {
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    handleZoom100
  };
}
