"use client";

import type { ReviewAnnotation, ReviewTool } from "@/features/review/review.types";
import { REVIEW_ANNOTATION_COLOR } from "@/features/review/review.constants";
import { cn } from "@/lib/utils";

function AnnotationShape({
  annotation,
  strokeWidth = 0.006,
  dimmed = false
}: {
  annotation: ReviewAnnotation;
  strokeWidth?: number;
  dimmed?: boolean;
}) {
  const stroke = dimmed ? "rgba(91,92,255,0.35)" : annotation.color;
  const sw = strokeWidth;

  if (annotation.type === "circle") {
    const radius = (annotation.width ?? 0.1) / 2;
    return (
      <circle
        cx={annotation.x}
        cy={annotation.y}
        r={radius}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  if (annotation.type === "rect") {
    return (
      <rect
        x={annotation.x}
        y={annotation.y}
        width={annotation.width ?? 0.1}
        height={annotation.height ?? 0.08}
        fill="rgba(91,92,255,0.08)"
        stroke={stroke}
        strokeWidth={sw}
        vectorEffect="non-scaling-stroke"
        rx={0.008}
      />
    );
  }

  const endX = annotation.endX ?? annotation.x;
  const endY = annotation.endY ?? annotation.y;
  const angle = Math.atan2(endY - annotation.y, endX - annotation.x);
  const head = 0.022;
  const leftX = endX - head * Math.cos(angle - Math.PI / 6);
  const leftY = endY - head * Math.sin(angle - Math.PI / 6);
  const rightX = endX - head * Math.cos(angle + Math.PI / 6);
  const rightY = endY - head * Math.sin(angle + Math.PI / 6);

  return (
    <g stroke={stroke} strokeWidth={sw} vectorEffect="non-scaling-stroke" fill={stroke}>
      <line x1={annotation.x} y1={annotation.y} x2={endX} y2={endY} />
      <polygon points={`${endX},${endY} ${leftX},${leftY} ${rightX},${rightY}`} stroke="none" />
    </g>
  );
}

export function ReviewAnnotationLayer({
  activeAnnotations,
  pendingAnnotations,
  draftAnnotation,
  activeTool,
  canDraw,
  onPointerDown,
  onPointerMove,
  onPointerUp
}: {
  activeAnnotations: ReviewAnnotation[];
  pendingAnnotations: ReviewAnnotation[];
  draftAnnotation: ReviewAnnotation | null;
  activeTool: ReviewTool;
  canDraw: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const layers = [
    ...activeAnnotations,
    ...pendingAnnotations,
    ...(draftAnnotation ? [draftAnnotation] : [])
  ];

  return (
    <div
      className={cn(
        "absolute inset-0 z-10",
        canDraw && activeTool ? "cursor-crosshair" : "pointer-events-none"
      )}
      onPointerDown={canDraw && activeTool ? onPointerDown : undefined}
      onPointerMove={canDraw && activeTool ? onPointerMove : undefined}
      onPointerUp={canDraw && activeTool ? onPointerUp : undefined}
    >
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        aria-hidden
      >
        {layers.map((annotation) => (
          <AnnotationShape key={annotation.id} annotation={annotation} />
        ))}
      </svg>
    </div>
  );
}

export function buildDraftAnnotation(input: {
  type: NonNullable<ReviewTool>;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  time: number;
}): ReviewAnnotation {
  const id = "draft";
  const color = REVIEW_ANNOTATION_COLOR;

  if (input.type === "circle") {
    const dx = input.currentX - input.startX;
    const dy = input.currentY - input.startY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    return {
      id,
      type: "circle",
      time: input.time,
      x: input.startX,
      y: input.startY,
      width: radius * 2,
      color
    };
  }

  if (input.type === "rect") {
    const x = Math.min(input.startX, input.currentX);
    const y = Math.min(input.startY, input.currentY);
    return {
      id,
      type: "rect",
      time: input.time,
      x,
      y,
      width: Math.abs(input.currentX - input.startX),
      height: Math.abs(input.currentY - input.startY),
      color
    };
  }

  return {
    id,
    type: "arrow",
    time: input.time,
    x: input.startX,
    y: input.startY,
    endX: input.currentX,
    endY: input.currentY,
    color
  };
}

export function finalizeAnnotation(draft: ReviewAnnotation, time: number): ReviewAnnotation {
  return {
    ...draft,
    id: crypto.randomUUID(),
    time
  };
}
