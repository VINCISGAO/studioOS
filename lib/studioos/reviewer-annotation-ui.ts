import type { ReviewComment } from "@/lib/studioos/review-comment-types";

export const REVIEWER_ANNOTATION_FRAME_TOLERANCE_SEC = 0.4;

export function reviewSameAnnotationFrame(timestampSecA: number, timestampSecB: number) {
  return Math.abs(timestampSecA - timestampSecB) < REVIEWER_ANNOTATION_FRAME_TOLERANCE_SEC;
}

export function reviewCommentsAtFrame(comments: ReviewComment[], timestampSec: number) {
  return comments.filter((item) => reviewSameAnnotationFrame(item.timestamp_sec, timestampSec));
}

export function reviewAnnotationComments(comments: ReviewComment[]) {
  return comments.filter((item) => (item.annotations?.length ?? 0) > 0);
}

export function reviewLatestAnnotationCommentAtFrame(comments: ReviewComment[], timestampSec: number) {
  return [...reviewCommentsAtFrame(comments, timestampSec)]
    .filter((item) => (item.annotations?.length ?? 0) > 0)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function reviewAnnotationStrokeWidth(strokeWidth: number) {
  return Math.max(0.0012, strokeWidth / 520);
}

export function reviewAnnotationTextFontSize(strokeWidth: number) {
  return Math.max(0.034, Math.min(0.058, 0.03 + strokeWidth * 0.0045));
}

export function reviewAnnotationHitStrokeWidth(strokeWidth: number) {
  return Math.max(0.012, reviewAnnotationStrokeWidth(strokeWidth) * 10);
}
