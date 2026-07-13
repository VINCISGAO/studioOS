"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import { Hand, Move, ZoomIn, ZoomOut } from "lucide-react";
import {
  centerCoverTransform,
  clampCoverTransform,
  type ImageCropTransform
} from "@/lib/studioos/image-crop-client";
import type { ImageCropViewportState } from "@/components/studioos/image-crop/image-crop-viewport";
import { cn } from "@/lib/utils";

export type AvatarCropEditorHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  getZoomPercent: () => number;
  setZoomPercent: (percent: number) => void;
};

type AvatarCropEditorProps = {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  dragHint: string;
  onTransformChange: (state: ImageCropViewportState) => void;
};

const CHECKERBOARD =
  "bg-[#f4f4f5] [background-image:linear-gradient(45deg,#e4e4e7_25%,transparent_25%),linear-gradient(-45deg,#e4e4e7_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e4e4e7_75%),linear-gradient(-45deg,transparent_75%,#e4e4e7_75%)] [background-size:14px_14px] [background-position:0_0,0_7px,7px_-7px,-7px_0]";

export const AvatarCropEditor = forwardRef<AvatarCropEditorHandle, AvatarCropEditorProps>(
  function AvatarCropEditor({ src, naturalWidth, naturalHeight, dragHint, onTransformChange }, ref) {
    const maskId = useId().replace(/:/g, "");
    const frameRef = useRef<HTMLDivElement | null>(null);
    const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
    const onTransformChangeRef = useRef(onTransformChange);
    const transformRef = useRef<ImageCropTransform>({ scale: 1, offsetX: 0, offsetY: 0 });
    const minScaleRef = useRef(1);
    const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
    const [transform, setTransform] = useState<ImageCropTransform>({ scale: 1, offsetX: 0, offsetY: 0 });
    const [minScale, setMinScale] = useState(1);

    onTransformChangeRef.current = onTransformChange;
    transformRef.current = transform;
    minScaleRef.current = minScale;

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

    const zoomFromPercent = useCallback(
      (percent: number) => {
        if (!naturalWidth || !frameSize.width || !minScale) return;
        const centerX = frameSize.width / 2;
        const centerY = frameSize.height / 2;
        const current = transformRef.current;
        const imageX = (centerX - current.offsetX) / current.scale;
        const imageY = (centerY - current.offsetY) / current.scale;
        const nextScale = minScale * (percent / 100);
        applyTransform({
          scale: nextScale,
          offsetX: centerX - imageX * nextScale,
          offsetY: centerY - imageY * nextScale
        });
      },
      [applyTransform, frameSize.height, frameSize.width, minScale, naturalWidth]
    );

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => {
          const percent = minScaleRef.current
            ? Math.round((transformRef.current.scale / minScaleRef.current) * 100)
            : 100;
          zoomFromPercent(Math.min(300, percent + 10));
        },
        zoomOut: () => {
          const percent = minScaleRef.current
            ? Math.round((transformRef.current.scale / minScaleRef.current) * 100)
            : 100;
          zoomFromPercent(Math.max(100, percent - 10));
        },
        reset: () => {
          if (!naturalWidth || !frameSize.width) return;
          const centered = centerCoverTransform(
            naturalWidth,
            naturalHeight,
            frameSize.width,
            frameSize.height
          );
          setMinScale(centered.scale);
          setTransform(centered);
          emitState(centered);
        },
        getZoomPercent: () =>
          minScaleRef.current
            ? Math.round((transformRef.current.scale / minScaleRef.current) * 100)
            : 100,
        setZoomPercent: zoomFromPercent
      }),
      [emitState, frameSize.height, frameSize.width, naturalWidth, naturalHeight, zoomFromPercent]
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
    }, []);

    useEffect(() => {
      const frame = frameRef.current;
      if (!frame) return;
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        const percent = minScaleRef.current
          ? Math.round((transformRef.current.scale / minScaleRef.current) * 100)
          : 100;
        const next = Math.min(300, Math.max(100, percent + (event.deltaY < 0 ? 8 : -8)));
        zoomFromPercent(next);
      };
      frame.addEventListener("wheel", onWheel, { passive: false });
      return () => frame.removeEventListener("wheel", onWheel);
    }, [zoomFromPercent]);

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

    const displayWidth = naturalWidth * transform.scale;
    const displayHeight = naturalHeight * transform.scale;
    const circleRadius = frameSize.width ? Math.round(frameSize.width * 0.36) : 0;

    return (
      <div
        ref={frameRef}
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-200 sm:rounded-2xl",
          CHECKERBOARD
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {src && naturalWidth ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            className="absolute left-0 top-0 max-w-none select-none touch-none"
            style={{
              width: displayWidth,
              height: displayHeight,
              transform: `translate3d(${transform.offsetX}px, ${transform.offsetY}px, 0)`
            }}
          />
        ) : null}

        {frameSize.width ? (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                <circle
                  cx="50%"
                  cy="50%"
                  r={circleRadius}
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(15,23,42,0.52)" mask={`url(#${maskId})`} />
            <circle
              cx="50%"
              cy="50%"
              r={circleRadius}
              fill="none"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        ) : null}

        <div
          className="pointer-events-none absolute left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_8px_20px_rgba(124,58,237,0.45)] sm:h-9 sm:w-9"
          style={{ top: frameSize.width ? `calc(50% - ${circleRadius}px - 12px)` : "12%" }}
        >
          <Move className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/45 to-transparent px-2 py-1.5 text-[10px] font-medium text-white sm:gap-1.5 sm:px-4 sm:py-3 sm:text-xs">
          <Hand className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">{dragHint}</span>
        </div>

        <button
          type="button"
          className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-700 shadow-md sm:bottom-4 sm:left-4 sm:h-10 sm:w-10"
          onClick={(event) => {
            event.stopPropagation();
            const percent = minScale ? Math.round((transform.scale / minScale) * 100) : 100;
            zoomFromPercent(Math.max(100, percent - 10));
          }}
        >
          <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
        <button
          type="button"
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-700 shadow-md sm:bottom-4 sm:right-4 sm:h-10 sm:w-10"
          onClick={(event) => {
            event.stopPropagation();
            const percent = minScale ? Math.round((transform.scale / minScale) * 100) : 100;
            zoomFromPercent(Math.min(300, percent + 10));
          }}
        >
          <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
    );
  }
);
