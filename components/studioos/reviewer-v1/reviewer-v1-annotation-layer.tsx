"use client";

import { useState } from "react";
import { ReviewerAnnotationTextDialog } from "@/components/studioos/reviewer-skeleton/reviewer-annotation-text-dialog";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import {
  reviewAnnotationHitStrokeWidth,
  reviewAnnotationStrokeWidth,
  reviewAnnotationTextFontSize
} from "@/lib/studioos/reviewer-annotation-ui";
import type { ReviewerAnnotationShape, ReviewerTool } from "@/components/studioos/reviewer-v1/reviewer-v1-types";

type DraftState = {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  surfaceWidth: number;
  surfaceHeight: number;
  points: Array<{ x: number; y: number }>;
};

const MIN_DRAG = 0.008;

function toNormalized(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    surfaceWidth: Math.max(1, rect.width),
    surfaceHeight: Math.max(1, rect.height)
  };
}

function hasMinDrag(draft: DraftState) {
  return Math.hypot(draft.currentX - draft.startX, draft.currentY - draft.startY) >= MIN_DRAG;
}

export function ReviewerV1AnnotationLayer({
  locale,
  annotations,
  pendingAnnotations,
  activeTool,
  canDraw,
  penColor,
  penSize,
  currentSec,
  onCreateAnnotation,
  onSelectAnnotation,
  onDeleteAnnotation,
  onClearSelection
}: {
  locale: Locale;
  annotations: ReviewerAnnotationShape[];
  pendingAnnotations: ReviewerAnnotationShape[];
  activeTool: ReviewerTool;
  canDraw: boolean;
  penColor: string;
  penSize: number;
  currentSec: number;
  onCreateAnnotation: (annotation: ReviewerAnnotationShape, suggestedBody?: string) => void;
  onSelectAnnotation?: (annotationId: string) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  onClearSelection?: () => void;
}) {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [textAnchor, setTextAnchor] = useState<{ x: number; y: number } | null>(null);
  const [textDraftValue, setTextDraftValue] = useState("");
  const isDrawingTool = ["pen", "arrow", "rect", "circle", "text"].includes(activeTool);
  const isEraseTool = activeTool === "delete" || activeTool === "eraser";
  const isInteractionTool = activeTool === "select" || isEraseTool;
  const overlayActive = canDraw && (isDrawingTool || isInteractionTool);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!overlayActive) return;

    if (isInteractionTool) {
      if (event.target === event.currentTarget) {
        onClearSelection?.();
      }
      return;
    }

    const point = toNormalized(event);
    if (activeTool === "text") {
      setTextAnchor(point);
      setTextDraftValue("");
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDraft({
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
      surfaceWidth: point.surfaceWidth,
      surfaceHeight: point.surfaceHeight,
      points: [{ x: point.x, y: point.y }]
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draft || draft.pointerId !== event.pointerId) return;
    const point = toNormalized(event);
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            currentX: point.x,
            currentY: point.y,
            points: activeTool === "pen" ? [...prev.points, point] : prev.points
          }
        : prev
    );
  }

  function finishDraft(event: React.PointerEvent<HTMLDivElement>) {
    if (!draft || draft.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const next = buildAnnotation(draft, activeTool, penColor, penSize, currentSec);
    setDraft(null);
    if (!next) return;
    onCreateAnnotation(next);
  }

  const draftAnnotation = draft
    ? buildAnnotation(draft, activeTool, penColor, penSize, currentSec, "draft")
    : null;
  const all = [...annotations, ...pendingAnnotations, ...(draftAnnotation ? [draftAnnotation] : [])];

  function closeTextDialog() {
    setTextAnchor(null);
    setTextDraftValue("");
  }

  function confirmTextAnnotation() {
    if (!textAnchor) return;
    const text = textDraftValue.trim();
    if (!text) return;
    onCreateAnnotation({
      id: crypto.randomUUID(),
      type: "TEXT",
      color: penColor,
      strokeWidth: penSize,
      x: textAnchor.x,
      y: textAnchor.y,
      width: 0.22,
      height: 0.08,
      dataJson: {
        x: textAnchor.x,
        y: textAnchor.y,
        width: 0.22,
        height: 0.08,
        text,
        timestampSec: currentSec
      }
    });
    closeTextDialog();
  }

  return (
    <>
      <ReviewerAnnotationTextDialog
        locale={locale}
        open={textAnchor !== null}
        value={textDraftValue}
        onValueChange={setTextDraftValue}
        onOpenChange={(open) => {
          if (!open) closeTextDialog();
        }}
        onConfirm={confirmTextAnnotation}
      />
      <div
      className={cn(
        "absolute inset-0 z-20",
        overlayActive ? "pointer-events-auto" : "pointer-events-none",
        activeTool === "delete" || activeTool === "eraser"
          ? "cursor-crosshair"
          : activeTool === "select"
            ? "cursor-default"
            : "cursor-crosshair"
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDraft}
      onPointerCancel={finishDraft}
    >
      <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="h-full w-full">
        {all.map((annotation) => (
          <AnnotationSvg
            key={annotation.id}
            annotation={annotation}
            activeTool={activeTool}
            canInteract={canDraw && isInteractionTool}
            onSelect={onSelectAnnotation}
            onDelete={onDeleteAnnotation}
          />
        ))}
      </svg>
      </div>
    </>
  );
}

function buildAnnotation(
  draft: DraftState,
  tool: ReviewerTool,
  color: string,
  strokeWidth: number,
  time: number,
  id = crypto.randomUUID()
): ReviewerAnnotationShape | null {
  if (tool === "arrow" && hasMinDrag(draft)) {
    return {
      id,
      type: "ARROW",
      color,
      strokeWidth,
      x: draft.startX,
      y: draft.startY,
      width: Math.abs(draft.currentX - draft.startX),
      height: Math.abs(draft.currentY - draft.startY),
      dataJson: {
        x: draft.startX,
        y: draft.startY,
        endX: draft.currentX,
        endY: draft.currentY,
        timestampSec: time
      }
    };
  }
  if (tool === "rect" && hasMinDrag(draft)) {
    const x = Math.min(draft.startX, draft.currentX);
    const y = Math.min(draft.startY, draft.currentY);
    const width = Math.abs(draft.currentX - draft.startX);
    const height = Math.abs(draft.currentY - draft.startY);
    return {
      id,
      type: "RECTANGLE",
      color,
      strokeWidth,
      x,
      y,
      width,
      height,
      dataJson: { x, y, width, height, timestampSec: time }
    };
  }
  if (tool === "circle" && hasMinDrag(draft)) {
    const radiusPx = Math.sqrt(
      ((draft.currentX - draft.startX) * draft.surfaceWidth) ** 2 +
      ((draft.currentY - draft.startY) * draft.surfaceHeight) ** 2
    );
    const width = (radiusPx / draft.surfaceWidth) * 2;
    const height = (radiusPx / draft.surfaceHeight) * 2;
    return {
      id,
      type: "CIRCLE",
      color,
      strokeWidth,
      x: draft.startX,
      y: draft.startY,
      width,
      height,
      dataJson: { x: draft.startX, y: draft.startY, width, height, timestampSec: time }
    };
  }
  if (tool === "pen" && draft.points.length >= 1) {
    const xs = draft.points.map((p) => p.x);
    const ys = draft.points.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const width = Math.max(...xs) - x;
    const height = Math.max(...ys) - y;
    return {
      id,
      type: "PEN",
      color,
      strokeWidth,
      x,
      y,
      width,
      height,
      dataJson: { x, y, width, height, points: draft.points, timestampSec: time }
    };
  }
  return null;
}

function AnnotationSvg({
  annotation,
  activeTool,
  canInteract,
  onSelect,
  onDelete
}: {
  annotation: ReviewerAnnotationShape;
  activeTool: ReviewerTool;
  canInteract: boolean;
  onSelect?: (annotationId: string) => void;
  onDelete?: (annotationId: string) => void;
}) {
  const sw = reviewAnnotationStrokeWidth(annotation.strokeWidth);
  const hitSw = reviewAnnotationHitStrokeWidth(annotation.strokeWidth);
  const data = (annotation.dataJson ?? {}) as Record<string, unknown>;

  function handleClick(event: React.MouseEvent | React.PointerEvent) {
    if (!canInteract) return;
    event.stopPropagation();
    if (activeTool === "delete" || activeTool === "eraser") {
      onDelete?.(annotation.id);
      return;
    }
    if (activeTool === "select") {
      onSelect?.(annotation.id);
    }
  }

  const interactiveProps = canInteract
    ? {
        onPointerDown: (event: React.PointerEvent) => {
          event.stopPropagation();
          handleClick(event);
        },
        style: {
          cursor:
            activeTool === "delete"
              ? "not-allowed"
              : activeTool === "eraser"
                ? "crosshair"
                : "pointer"
        } as const
      }
    : {};

  const eraseHit =
    canInteract && (activeTool === "delete" || activeTool === "eraser") ? (
      <HitTarget annotation={annotation} data={data} strokeWidth={hitSw} />
    ) : null;

  if (annotation.type === "RECTANGLE") {
    return (
      <g {...interactiveProps}>
        {eraseHit}
        <rect
          x={annotation.x}
          y={annotation.y}
          width={annotation.width}
          height={annotation.height}
          fill="none"
          stroke={annotation.color}
          strokeWidth={sw}
        />
      </g>
    );
  }
  if (annotation.type === "CIRCLE") {
    return (
      <g {...interactiveProps}>
        {eraseHit}
        <ellipse
          cx={annotation.x}
          cy={annotation.y}
          rx={annotation.width / 2}
          ry={annotation.height / 2}
          fill="none"
          stroke={annotation.color}
          strokeWidth={sw}
        />
      </g>
    );
  }
  if (annotation.type === "ARROW") {
    const endX = Number(data.endX ?? annotation.x);
    const endY = Number(data.endY ?? annotation.y);
    const angle = Math.atan2(endY - annotation.y, endX - annotation.x);
    const head = 0.02;
    const leftX = endX - head * Math.cos(angle - Math.PI / 6);
    const leftY = endY - head * Math.sin(angle - Math.PI / 6);
    const rightX = endX - head * Math.cos(angle + Math.PI / 6);
    const rightY = endY - head * Math.sin(angle + Math.PI / 6);
    return (
      <g {...interactiveProps} stroke={annotation.color} strokeWidth={sw} fill={annotation.color}>
        {eraseHit}
        <line x1={annotation.x} y1={annotation.y} x2={endX} y2={endY} />
        <polygon points={`${endX},${endY} ${leftX},${leftY} ${rightX},${rightY}`} stroke="none" />
      </g>
    );
  }
  if (annotation.type === "PEN") {
    const points = Array.isArray(data.points) ? (data.points as Array<{ x: number; y: number }>) : [];
    const path = points.map((p, idx) => `${idx ? "L" : "M"}${p.x} ${p.y}`).join(" ");
    return (
      <g {...interactiveProps}>
        {eraseHit}
        <path
          d={path}
          fill="none"
          stroke={annotation.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={sw}
        />
      </g>
    );
  }
  if (annotation.type === "TEXT") {
    const text = String(data.text ?? "");
    return (
      <g {...interactiveProps}>
        {eraseHit}
        <text
          x={annotation.x}
          y={annotation.y}
          fill={annotation.color}
          fontFamily="'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize={reviewAnnotationTextFontSize(annotation.strokeWidth)}
          fontWeight={600}
          dominantBaseline="hanging"
          letterSpacing="0.01em"
          paintOrder="stroke fill"
          stroke="rgba(0,0,0,0.45)"
          strokeWidth={Math.max(0.0008, reviewAnnotationTextFontSize(annotation.strokeWidth) * 0.08)}
        >
          {text}
        </text>
      </g>
    );
  }
  return null;
}

function HitTarget({
  annotation,
  data,
  strokeWidth
}: {
  annotation: ReviewerAnnotationShape;
  data: Record<string, unknown>;
  strokeWidth: number;
}) {
  if (annotation.type === "RECTANGLE") {
    return (
      <rect
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        fill="none"
        stroke="transparent"
        strokeWidth={strokeWidth}
        pointerEvents="stroke"
      />
    );
  }
  if (annotation.type === "CIRCLE") {
    return (
      <ellipse
        cx={annotation.x}
        cy={annotation.y}
        rx={annotation.width / 2}
        ry={annotation.height / 2}
        fill="none"
        stroke="transparent"
        strokeWidth={strokeWidth}
        pointerEvents="stroke"
      />
    );
  }
  if (annotation.type === "ARROW") {
    const endX = Number(data.endX ?? annotation.x);
    const endY = Number(data.endY ?? annotation.y);
    return (
      <line
        x1={annotation.x}
        y1={annotation.y}
        x2={endX}
        y2={endY}
        stroke="transparent"
        strokeWidth={strokeWidth}
        pointerEvents="stroke"
      />
    );
  }
  if (annotation.type === "PEN") {
    const points = Array.isArray(data.points) ? (data.points as Array<{ x: number; y: number }>) : [];
    const path = points.map((p, idx) => `${idx ? "L" : "M"}${p.x} ${p.y}`).join(" ");
    return (
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        pointerEvents="stroke"
      />
    );
  }
  if (annotation.type === "TEXT") {
    return (
      <rect
        x={annotation.x - 0.01}
        y={annotation.y - 0.04}
        width={Math.max(annotation.width, 0.18)}
        height={Math.max(annotation.height, 0.06)}
        fill="transparent"
        pointerEvents="fill"
      />
    );
  }
  return null;
}
