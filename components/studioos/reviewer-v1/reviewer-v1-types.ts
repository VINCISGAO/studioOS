import type { Locale } from "@/lib/i18n";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import { normalizeStoredAnnotationDataJson } from "@/lib/studioos/review-annotation-json";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { ReactNode } from "react";

export type ReviewerTool =
  | "select"
  | "pen"
  | "arrow"
  | "rect"
  | "circle"
  | "text"
  | "delete"
  | "eraser";

export type ReviewerAnnotationType =
  | "POINT"
  | "ARROW"
  | "RECTANGLE"
  | "CIRCLE"
  | "PEN"
  | "TEXT";

export type ReviewerAnnotationShape = {
  id: string;
  type: ReviewerAnnotationType;
  color: string;
  strokeWidth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataJson?: unknown;
};

export type ReviewerComment = ReviewComment;

export type ReviewerWorkspaceProps = {
  locale: Locale;
  order: StoredOrder;
  campaignTitle: string;
  deliverables: StoredDeliverable[];
  initialComments: ReviewComment[];
  initialVersion: number;
  role: "brand" | "creator";
  backHref: string;
  backLabel?: string;
  actionError?: string;
  flash?: "completed" | "revision";
  showPolicyNotice?: boolean;
  decisionSlot?: ReactNode;
};

export function annotationFromComment(comment: ReviewComment): ReviewerAnnotationShape[] {
  const defaultX = typeof comment.pos_x === "number" ? comment.pos_x : 0.5;
  const defaultY = typeof comment.pos_y === "number" ? comment.pos_y : 0.5;
  const rows = comment.annotations ?? [];
  if (!rows.length) {
    return [];
  }
  return rows.map((annotation) => {
    const data = (annotation.data_json ?? {}) as Record<string, unknown>;
    const x = num(data.x, defaultX);
    const y = num(data.y, defaultY);
    const width = num(data.width, 0);
    const height = num(data.height, 0);
    return {
      id: annotation.id,
      type: normalizeAnnotationType(annotation.type),
      color: annotation.color ?? "#FF4D4F",
      strokeWidth: annotation.stroke_width ?? 2,
      x,
      y,
      width,
      height,
      dataJson: normalizeStoredAnnotationDataJson(annotation.data_json, comment.timestamp_sec, {
        x,
        y,
        width,
        height
      })
    };
  });
}

function normalizeAnnotationType(raw: string): ReviewerAnnotationType {
  if (
    raw === "POINT" ||
    raw === "ARROW" ||
    raw === "RECTANGLE" ||
    raw === "CIRCLE" ||
    raw === "PEN" ||
    raw === "TEXT"
  ) {
    return raw;
  }
  return "POINT";
}

function num(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
