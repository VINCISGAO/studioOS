"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  centerCoverTransform,
  clampCoverTransform,
  type ImageCropTransform
} from "@/lib/studioos/image-crop-client";
import { cn } from "@/lib/utils";

export type ImageCropViewportState = {
  transform: ImageCropTransform;
  frameSize: { width: number; height: number };
  naturalSize: { width: number; height: number };
};

type ImageCropViewportProps = {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: number;
  hint: string;
  zoomLabel: string;
  onTransformChange: (state: ImageCropViewportState) => void;
};

export function ImageCropViewport({
  src,
  naturalWidth,
  naturalHeight,
  aspectRatio,
  hint,
  zoomLabel,
  onTransformChange
}: ImageCropViewportProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const onTransformChangeRef = useRef(onTransformChange);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState<ImageCropTransform>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [minScale, setMinScale] = useState(1);

  onTransformChangeRef.current = onTransformChange;

  const emitState = useCallback(
    (nextTransform: ImageCropTransform) => {
      if (!naturalWidth || !frameSize.width) return;
      onTransformChangeRef.current({
        transform: nextTransform,
        frameSize,
        naturalSize: { width: naturalWidth, height: naturalHeight }
      });
    },
    [frameSize, naturalWidth, naturalHeight]
  );

  const applyTransform = useCallback(
    (next: ImageCropTransform) => {
      if (!naturalWidth || !frameSize.width) return;
      const clamped = clampCoverTransform(
        naturalWidth,
        naturalHeight,
        frameSize.width,
        frameSize.height,
        next
      );
      setTransform(clamped);
      emitState(clamped);
    },
    [emitState, frameSize.height, frameSize.width, naturalWidth, naturalHeight]
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(1, Math.round(entry.contentRect.width));
      const height = Math.max(1, Math.round(entry.contentRect.height));
      setFrameSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [aspectRatio]);

  useEffect(() => {
    if (!naturalWidth || !frameSize.width) return;
    const centered = centerCoverTransform(
      naturalWidth,
      naturalHeight,
      frameSize.width,
      frameSize.height
    );
    setMinScale(centered.scale);
    setTransform(centered);
    onTransformChangeRef.current({
      transform: centered,
      frameSize,
      naturalSize: { width: naturalWidth, height: naturalHeight }
    });
  }, [frameSize.height, frameSize.width, naturalWidth, naturalHeight, src]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!naturalWidth) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    applyTransform({
      ...transform,
      offsetX: drag.offsetX + (event.clientX - drag.x),
      offsetY: drag.offsetY + (event.clientY - drag.y)
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const zoomPercent = minScale ? Math.round((transform.scale / minScale) * 100) : 100;
  const displayWidth = naturalWidth * transform.scale;
  const displayHeight = naturalHeight * transform.scale;

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-hidden">
      <div
        ref={frameRef}
        className="relative isolate w-full max-w-full min-h-[180px] overflow-hidden rounded-[22px] border border-zinc-200 bg-zinc-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
        style={{ aspectRatio: String(aspectRatio) }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {src && naturalWidth && frameSize.width ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            className="absolute left-0 top-0 max-w-none select-none touch-none will-change-transform"
            style={{
              width: displayWidth,
              height: displayHeight,
              maxWidth: "none",
              transform: `translate3d(${transform.offsetX}px, ${transform.offsetY}px, 0)`
            }}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/20" />
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="border border-white/10" />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 py-3 text-center text-xs font-medium text-white/90">
          {hint}
        </div>
      </div>

      <label className="block min-w-0 max-w-full space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="shrink-0 font-medium text-zinc-700">{zoomLabel}</span>
          <span className="shrink-0 tabular-nums text-zinc-500">{zoomPercent}%</span>
        </div>
        <div className="min-w-0 max-w-full overflow-hidden px-0.5">
          <input
            type="range"
            min={100}
            max={300}
            step={1}
            value={zoomPercent}
            disabled={!naturalWidth || !frameSize.width}
            onChange={(event) => {
              const nextPercent = Number(event.target.value);
              if (!naturalWidth || !frameSize.width || !minScale) return;
              const centerX = frameSize.width / 2;
              const centerY = frameSize.height / 2;
              const imageX = (centerX - transform.offsetX) / transform.scale;
              const imageY = (centerY - transform.offsetY) / transform.scale;
              const nextScale = minScale * (nextPercent / 100);
              applyTransform({
                scale: nextScale,
                offsetX: centerX - imageX * nextScale,
                offsetY: centerY - imageY * nextScale
              });
            }}
            className={cn(
              "box-border h-2 w-full max-w-full min-w-0 cursor-pointer appearance-none rounded-full bg-zinc-200",
              "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-600",
              "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-violet-600"
            )}
          />
        </div>
      </label>
    </div>
  );
}
