"use client";

import type { VideoComment } from "@/lib/mvp/types";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CircleDraft = NormalizedRect & { seconds: number };

const DEFAULT_COLOR = "#F59E0B";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function normalizeRect(a: { x: number; y: number }, b: { x: number; y: number }): NormalizedRect {
  const x1 = clamp01(Math.min(a.x, b.x));
  const y1 = clamp01(Math.min(a.y, b.y));
  const x2 = clamp01(Math.max(a.x, b.x));
  const y2 = clamp01(Math.max(a.y, b.y));
  return {
    x: x1,
    y: y1,
    width: Math.max(x2 - x1, 0.02),
    height: Math.max(y2 - y1, 0.02)
  };
}

function toSvgEllipse(rect: NormalizedRect) {
  return {
    cx: rect.x + rect.width / 2,
    cy: rect.y + rect.height / 2,
    rx: rect.width / 2,
    ry: rect.height / 2
  };
}

export function VideoAnnotationLayer({
  comments,
  activeCommentId,
  currentSec,
  isPaused,
  tool,
  canDraw,
  color = DEFAULT_COLOR,
  onSelectComment,
  onCircleComplete
}: {
  comments: VideoComment[];
  activeCommentId: string | null;
  currentSec: number;
  isPaused: boolean;
  tool: "select" | "circle";
  canDraw: boolean;
  color?: string;
  onSelectComment: (id: string) => void;
  onCircleComplete: (draft: CircleDraft) => void;
}) {
  const layerRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  const pointerToNorm = useCallback((clientX: number, clientY: number) => {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height)
    };
  }, []);

  function commentVisible(comment: VideoComment) {
    if (!comment.annotation_type || comment.pos_x == null || comment.pos_y == null) return false;
    if (isPaused) return Math.abs(currentSec - comment.timestamp_seconds) < 0.35;
    return Math.abs(currentSec - comment.timestamp_seconds) < 0.2;
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!canDraw || tool !== "circle" || !isPaused) return;
    if ((e.target as Element).closest("[data-annotation-hit]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = pointerToNorm(e.clientX, e.clientY);
    setDragStart(pt);
    setDragCurrent(pt);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragStart) return;
    setDragCurrent(pointerToNorm(e.clientX, e.clientY));
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragStart || !dragCurrent) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const rect = normalizeRect(dragStart, dragCurrent);
    setDragStart(null);
    setDragCurrent(null);
    if (rect.width < 0.03 && rect.height < 0.03) return;
    onCircleComplete({ ...rect, seconds: currentSec });
  }

  const draftRect = dragStart && dragCurrent ? normalizeRect(dragStart, dragCurrent) : null;
  const draftEllipse = draftRect ? toSvgEllipse(draftRect) : null;

  return (
    <svg
      ref={layerRef}
      className={cn(
        "absolute inset-0 z-10 h-full w-full touch-none",
        tool === "circle" && canDraw && isPaused ? "cursor-crosshair" : "cursor-default"
      )}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {comments.map((comment, index) => {
        if (!commentVisible(comment)) return null;
        if (
          comment.annotation_type !== "circle" ||
          comment.pos_x == null ||
          comment.pos_y == null ||
          comment.width == null ||
          comment.height == null
        ) {
          return null;
        }
        const rect: NormalizedRect = {
          x: comment.pos_x,
          y: comment.pos_y,
          width: comment.width,
          height: comment.height
        };
        const { cx, cy, rx, ry } = toSvgEllipse(rect);
        const stroke = comment.color ?? DEFAULT_COLOR;
        const active = activeCommentId === comment.id;

        return (
          <g key={comment.id} data-annotation-hit>
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={stroke}
              strokeWidth={0.004}
              vectorEffect="non-scaling-stroke"
              className={cn("pointer-events-auto", active && "drop-shadow-sm")}
              onClick={(e) => {
                e.stopPropagation();
                onSelectComment(comment.id);
              }}
            />
            <circle
              cx={cx - rx * 0.6}
              cy={cy - ry * 0.6}
              r={0.018}
              fill={stroke}
              className="pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                onSelectComment(comment.id);
              }}
            />
            <text
              x={cx - rx * 0.6}
              y={cy - ry * 0.6}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={0.022}
              fontWeight="700"
              className="pointer-events-none select-none"
            >
              {index + 1}
            </text>
          </g>
        );
      })}

      {draftEllipse ? (
        <ellipse
          cx={draftEllipse.cx}
          cy={draftEllipse.cy}
          rx={draftEllipse.rx}
          ry={draftEllipse.ry}
          fill="none"
          stroke={color}
          strokeWidth={0.004}
          strokeDasharray="0.012 0.008"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ) : null}
    </svg>
  );
}
