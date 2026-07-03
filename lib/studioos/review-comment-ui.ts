import type { ReviewComment } from "@/lib/studioos/review-comment-types";
export type { ReviewComment, ReviewCommentAnnotation, ReviewCommentStatus } from "@/lib/studioos/review-comment-types";
export {
  countUnresolvedReviewComments,
  normalizeReviewCommentStatus
} from "@/lib/studioos/review-comment-status";

export function sortReviewCommentsForUi(comments: ReviewComment[]) {
  return [...comments].sort(
    (a, b) =>
      a.timestamp_sec - b.timestamp_sec ||
      String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
  );
}

/** Keep optimistic client rows until the server returns the same ids. Tombstones block resurrecting deletes. */
export function mergeReviewCommentsForUi(
  local: ReviewComment[],
  server: ReviewComment[],
  tombstoneIds?: ReadonlySet<string>
) {
  const merged = new Map<string, ReviewComment>();
  for (const item of server) {
    if (tombstoneIds?.has(item.id)) continue;
    merged.set(item.id, item);
  }
  for (const item of local) {
    if (tombstoneIds?.has(item.id)) continue;
    const existing = merged.get(item.id);
    if (existing) {
      merged.set(item.id, {
        ...existing,
        ...item,
        status: item.status,
        resolved_at: item.resolved_at ?? existing.resolved_at
      });
    } else {
      merged.set(item.id, item);
    }
  }
  return sortReviewCommentsForUi([...merged.values()]);
}
