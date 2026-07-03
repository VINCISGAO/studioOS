import { buildReviewAnnotationDataJson } from "@/lib/studioos/review-annotation-json";
import type { ReviewerAnnotationShape } from "@/components/studioos/reviewer-v1/reviewer-v1-types";

export function serializeAnnotations(annotations: ReviewerAnnotationShape[], timestampSec: number) {
  return JSON.stringify(
    annotations.map((item) => ({
      id: item.id,
      type: item.type,
      color: item.color,
      stroke_width: item.strokeWidth,
      data_json: buildReviewAnnotationDataJson(item, timestampSec)
    }))
  );
}
