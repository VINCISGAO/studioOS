import type { ReviewerAnnotationShape } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import type { ReviewCommentAnnotation } from "@/lib/studioos/review-comment-types";
import { normalizeReviewCommentTimestampSec } from "@/lib/studioos/review-comment-time";

function num(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildReviewAnnotationDataJson(
  annotation: Pick<ReviewerAnnotationShape, "type" | "x" | "y" | "width" | "height" | "dataJson">,
  timestampSec: number
): Record<string, unknown> {
  const base =
    annotation.dataJson && typeof annotation.dataJson === "object"
      ? { ...(annotation.dataJson as Record<string, unknown>) }
      : {};
  const ts = normalizeReviewCommentTimestampSec(timestampSec);

  return {
    ...base,
    x: num(base.x, annotation.x),
    y: num(base.y, annotation.y),
    width: num(base.width, annotation.width),
    height: num(base.height, annotation.height),
    timestampSec: normalizeReviewCommentTimestampSec(base.timestampSec ?? ts)
  };
}

export function normalizeStoredAnnotationDataJson(
  raw: unknown,
  timestampSec: number,
  coords: { x: number; y: number; width: number; height: number }
): Record<string, unknown> {
  const data = raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : {};
  const ts = normalizeReviewCommentTimestampSec(timestampSec);

  return {
    ...data,
    x: num(data.x, coords.x),
    y: num(data.y, coords.y),
    width: num(data.width, coords.width),
    height: num(data.height, coords.height),
    timestampSec: normalizeReviewCommentTimestampSec(data.timestampSec ?? ts)
  };
}

export function enrichReviewCommentAnnotations(
  annotations: ReviewCommentAnnotation[],
  timestampSec: number,
  fallback?: { x?: number | null; y?: number | null }
): ReviewCommentAnnotation[] {
  return annotations.map((annotation) => {
    const data = (annotation.data_json ?? {}) as Record<string, unknown>;
    const x = num(data.x, fallback?.x ?? 0.5);
    const y = num(data.y, fallback?.y ?? 0.5);
    const width = num(data.width, 0);
    const height = num(data.height, 0);

    return {
      ...annotation,
      data_json: normalizeStoredAnnotationDataJson(annotation.data_json, timestampSec, {
        x,
        y,
        width,
        height
      })
    };
  });
}

export function reviewerShapesToStoredAnnotations(
  shapes: ReviewerAnnotationShape[],
  timestampSec: number
): ReviewCommentAnnotation[] {
  return shapes.map((shape, index) => ({
    id: shape.id || `ann_${index}`,
    type: shape.type,
    color: shape.color,
    stroke_width: shape.strokeWidth,
    data_json: buildReviewAnnotationDataJson(shape, timestampSec)
  }));
}
