export type ReviewCommentStatus = "todo" | "in_progress" | "pending_confirmation" | "resolved";

export type ReviewCommentAnnotation = {
  id: string;
  type: string;
  color: string;
  stroke_width: number;
  data_json?: unknown;
};

export function coerceReviewCommentAnnotation(
  row: Record<string, unknown>,
  idFallback: string
): ReviewCommentAnnotation | null {
  const dataJson = row.data_json ?? row.dataJson;
  return {
    id: row.id != null && String(row.id).trim() ? String(row.id) : idFallback,
    type: String(row.type ?? "POINT").toUpperCase(),
    color: String(row.color ?? "#FF4D4F"),
    stroke_width: Number(row.stroke_width ?? row.strokeWidth ?? 2) || 2,
    ...(dataJson !== undefined && dataJson !== null ? { data_json: dataJson } : {})
  };
}

export function parseReviewCommentAnnotations(
  raw: unknown,
  idPrefix: string
): ReviewCommentAnnotation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) =>
      item && typeof item === "object"
        ? coerceReviewCommentAnnotation(item as Record<string, unknown>, `${idPrefix}_${index}`)
        : null
    )
    .filter((item): item is ReviewCommentAnnotation => item !== null);
}

export type ReviewComment = {
  id: string;
  order_id: string;
  version: number;
  /** Playback position in seconds (supports decimals). */
  timestamp_sec: number;
  body: string;
  /** Normalized click position on video frame, 0–1. */
  pos_x?: number | null;
  pos_y?: number | null;
  issue_type?: string | null;
  author: "brand" | "studio";
  created_by?: string | null;
  author_display_name?: string;
  annotations?: ReviewCommentAnnotation[];
  status: ReviewCommentStatus;
  created_at: string;
  resolved_at: string | null;
};
