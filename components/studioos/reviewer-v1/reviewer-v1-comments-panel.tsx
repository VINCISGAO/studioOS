"use client";

import { useMemo } from "react";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { getReviewerV1Copy } from "@/components/studioos/reviewer-v1/reviewer-v1-copy";
import type { ReviewerVideoStatus } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";

function commentPlaceholder(
  locale: Locale,
  role: "brand" | "creator",
  canComment: boolean,
  isPlaying: boolean,
  videoStatus: ReviewerVideoStatus
) {
  const t = getReviewerV1Copy(locale);
  if (role === "creator") return t.comments.brandOnly;
  if (isPlaying) return t.player.pauseToComment;
  if (canComment && videoStatus === "missing") return t.comments.noVideo;
  if (canComment && videoStatus === "error") return t.comments.textOnlyFallback;
  if (videoStatus === "loading") return t.player.loadingVideo;
  return t.comments.placeholder;
}

export function ReviewerV1CommentsPanel({
  locale,
  role,
  comments,
  currentFilter,
  draftBody,
  canComment,
  isPlaying,
  videoStatus,
  activeCommentId,
  onFilterChange,
  onDraftBodyChange,
  onAddComment,
  onSelectComment,
  onToggleStatus
}: {
  locale: Locale;
  role: "brand" | "creator";
  comments: ReviewComment[];
  currentFilter: "all" | "open" | "resolved";
  draftBody: string;
  canComment: boolean;
  isPlaying: boolean;
  videoStatus: ReviewerVideoStatus;
  activeCommentId: string | null;
  onFilterChange: (filter: "all" | "open" | "resolved") => void;
  onDraftBodyChange: (value: string) => void;
  onAddComment: () => void;
  onSelectComment: (comment: ReviewComment) => void;
  onToggleStatus: (commentId: string, status: "open" | "resolved") => void;
}) {
  const t = getReviewerV1Copy(locale);
  const placeholder = commentPlaceholder(locale, role, canComment, isPlaying, videoStatus);
  const filtered = useMemo(() => {
    if (currentFilter === "all") return comments;
    if (currentFilter === "open") return comments.filter((item) => item.status !== "resolved");
    return comments.filter((item) => item.status === "resolved");
  }, [comments, currentFilter]);
  return (
    <aside className="flex min-h-[560px] flex-col rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-3">
        <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 text-xs">
          {(["all", "open", "resolved"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={`rounded px-2 py-1 ${item === currentFilter ? "bg-white shadow-sm" : ""}`}
              onClick={() => onFilterChange(item)}
            >
              {item === "all" ? t.comments.all : item === "open" ? t.comments.open : t.comments.resolved}
            </button>
          ))}
        </div>
      </div>
      <div className="border-b border-zinc-200 p-3">
        <textarea
          value={draftBody}
          rows={3}
          disabled={!canComment}
          placeholder={placeholder}
          className="w-full resize-none rounded border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400 disabled:bg-zinc-50"
          onChange={(event) => onDraftBodyChange(event.target.value)}
        />
        <button
          type="button"
          disabled={!canComment || !draftBody.trim()}
          className="mt-2 rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          onClick={onAddComment}
        >
          {t.comments.send}
        </button>
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.length ? (
          filtered.map((comment) => (
            <li
              key={comment.id}
              className={`rounded border p-3 ${activeCommentId === comment.id ? "border-indigo-300 bg-indigo-50/50" : "border-zinc-200"}`}
            >
              <button type="button" className="w-full text-left" onClick={() => onSelectComment(comment)}>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono text-indigo-600">{formatTimestamp(comment.timestamp_sec)}</span>
                  <span>{comment.author_display_name ?? comment.author}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 ${comment.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {comment.status === "resolved" ? t.comments.resolvedStatus : t.comments.openStatus}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-800">{comment.body}</p>
              </button>
              {role === "brand" ? (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-zinc-500 hover:text-zinc-800"
                    onClick={() =>
                      onToggleStatus(comment.id, comment.status === "resolved" ? "open" : "resolved")
                    }
                  >
                    {comment.status === "resolved" ? t.comments.openStatus : t.comments.resolvedStatus}
                  </button>
                </div>
              ) : null}
            </li>
          ))
        ) : (
          <li className="py-8 text-center text-sm text-zinc-400">{t.comments.empty}</li>
        )}
      </ul>
    </aside>
  );
}
