import type { ReviewCommentStatus } from "@/lib/studioos/review-comment-types";

/** Unresolved workflow states (replaces legacy `"open"` checks). */
export function isReviewCommentUnresolved(
  status: ReviewCommentStatus | string | null | undefined
): boolean {
  return status !== "resolved";
}

export function countUnresolvedReviewComments(
  comments: ReadonlyArray<{ status?: ReviewCommentStatus | string | null }>
): number {
  return comments.filter((item) => item.status !== "resolved").length;
}

export function normalizeReviewCommentStatus(raw: unknown): ReviewCommentStatus {
  if (raw === "resolved" || raw === "RESOLVED" || raw === "handled") return "resolved";
  if (raw === "in_progress" || raw === "IN_PROGRESS" || raw === "processing") {
    return "in_progress";
  }
  if (
    raw === "pending_confirmation" ||
    raw === "PENDING_CONFIRMATION" ||
    raw === "waiting_brand_confirm" ||
    raw === "waiting"
  ) {
    return "pending_confirmation";
  }
  return "todo";
}
