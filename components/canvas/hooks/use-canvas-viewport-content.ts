"use client";

import { useCallback, useEffect, useMemo, useState, type RefObject } from "react";
import { useStoreApi } from "@xyflow/react";
import { useCanvasStore } from "@/components/canvas/canvas-store";
import { isViewportShowingCanvasNodes } from "@/lib/canvas/viewport-content";
import type { ViewportRect } from "@/lib/canvas/viewport-anchor";

export function useCanvasViewportContent(flowRef: RefObject<HTMLDivElement | null>) {
  const nodes = useCanvasStore((state) => state.nodes);
  const viewport = useCanvasStore((state) => state.viewport);
  const storeApi = useStoreApi();
  const [rect, setRect] = useState<ViewportRect>({ width: 0, height: 0 });
  const [moveTick, setMoveTick] = useState(0);

  const measureRect = useCallback(() => {
    const element = flowRef.current;
    if (!element) return;
    setRect({ width: element.clientWidth, height: element.clientHeight });
  }, [flowRef]);

  useEffect(() => {
    measureRect();
    const element = flowRef.current;
    if (!element) return;
    const observer = new ResizeObserver(measureRect);
    observer.observe(element);
    return () => observer.disconnect();
  }, [flowRef, measureRect]);

  useEffect(() => {
    let lastTransform = storeApi.getState().transform.join(",");
    return storeApi.subscribe((state) => {
      const nextTransform = state.transform.join(",");
      if (nextTransform === lastTransform) return;
      lastTransform = nextTransform;
      setMoveTick((value) => value + 1);
    });
  }, [storeApi]);

  const hasVisibleContent = useMemo(() => {
    void moveTick;
    const liveViewport = storeApi.getState().transform;
    const resolvedViewport = {
      x: liveViewport[0],
      y: liveViewport[1],
      zoom: liveViewport[2]
    };
    return isViewportShowingCanvasNodes(nodes, resolvedViewport, rect);
  }, [moveTick, nodes, rect, storeApi, viewport]);

  return {
    hasVisibleContent,
    showEmptyHint: nodes.length > 0 && !hasVisibleContent
  };
}
