"use client";

import { MoreHorizontal } from "lucide-react";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment, ReviewCommentStatus } from "@/lib/studioos/review-comment-types";
import { cn } from "@/lib/utils";

function markerColor(index: number) {
  const colors = ["bg-orange-500", "bg-violet-500", "bg-emerald-500", "bg-sky-500", "bg-rose-500"];
  return colors[(index - 1) % colors.length];
}

export function ReviewerPortalCommentCard({
  locale,
  role,
  variant = "portal",
  comment,
  marker,
  active,
  pending,
  menuOpen,
  labels,
  onSelect,
  onToggleMenu,
  onDelete,
  canDelete = true,
  onSetCommentStatus,
  showReply = false,
  replyActive = false,
  onReply
}: {
  locale: Locale;
  role: "brand" | "creator";
  variant?: "portal" | "focus";
  comment: ReviewComment;
  marker?: number;
  active: boolean;
  pending: boolean;
  menuOpen: boolean;
  labels: {
    reply: string;
    deleteComment: string;
    status: string;
    confirmResolved: string;
    requestMoreChanges: string;
    markInProgress: string;
    markPendingConfirmation: string;
  };
  onSelect: () => void;
  onToggleMenu: () => void;
  onDelete: () => void;
  canDelete?: boolean;
  onSetCommentStatus?: (commentId: string, status: ReviewCommentStatus) => void;
  showReply?: boolean;
  replyActive?: boolean;
  onReply?: () => void;
}) {
  const name = comment.author_display_name ?? comment.author;
  const isDark = variant === "focus";

  return (
    <article
      className={cn(
        "rounded-xl border p-3 shadow-sm transition",
        isDark
          ? active
            ? "border-violet-500/60 bg-zinc-900 ring-1 ring-violet-500/20"
            : "border-zinc-800 bg-zinc-900"
          : active
            ? "border-violet-300 bg-white ring-1 ring-violet-100"
            : "border-zinc-200 bg-white"
      )}
    >
      <div className="flex items-start gap-2.5">
        {marker ? (
          <span
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
              markerColor(marker)
            )}
          >
            {marker}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>{name}</span>
            <span className={cn("font-mono text-xs", isDark ? "text-violet-400" : "text-violet-600")}>
              {formatTimestamp(comment.timestamp_sec)}
            </span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                comment.status === "resolved"
                  ? isDark
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-emerald-50 text-emerald-700"
                  : comment.status === "pending_confirmation"
                    ? isDark
                      ? "bg-sky-500/15 text-sky-300"
                      : "bg-sky-50 text-sky-700"
                    : comment.status === "in_progress"
                      ? isDark
                        ? "bg-violet-500/15 text-violet-300"
                        : "bg-violet-50 text-violet-700"
                      : isDark
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-amber-50 text-amber-700"
              )}
            >
              {labels.status}
            </span>
          </div>
          <button type="button" className="mt-2 w-full text-left" onClick={onSelect}>
            <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", isDark ? "text-zinc-300" : "text-zinc-700")}>
              {comment.body}
            </p>
          </button>
          <div className="mt-3 flex items-center justify-between gap-2">
            {showReply ? (
              <button
                type="button"
                className={cn(
                  "text-xs font-medium hover:underline",
                  replyActive
                    ? isDark
                      ? "text-violet-300 underline"
                      : "text-violet-700 underline"
                    : isDark
                      ? "text-violet-400"
                      : "text-violet-600"
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  onReply?.();
                }}
              >
                {labels.reply}
              </button>
            ) : (
              <span />
            )}
            <div className="relative">
              <button
                type="button"
                aria-label={locale === "zh" ? "更多" : "More"}
                className={cn(
                  "rounded-lg p-1 hover:text-zinc-300",
                  isDark ? "text-zinc-500 hover:bg-zinc-800" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                )}
                onClick={onToggleMenu}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && role === "brand" ? (
                <div
                  className={cn(
                    "absolute right-0 top-8 z-10 min-w-[120px] rounded-lg border py-1 shadow-lg",
                    isDark ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-white"
                  )}
                >
                  {canDelete ? (
                    <button
                      type="button"
                      className={cn(
                        "block w-full px-3 py-2 text-left text-xs hover:bg-red-950/40",
                        isDark ? "text-red-400" : "text-red-600 hover:bg-red-50"
                      )}
                      onClick={onDelete}
                    >
                      {labels.deleteComment}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          {onSetCommentStatus && role === "brand" && comment.status === "pending_confirmation" ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                onClick={() => onSetCommentStatus(comment.id, "resolved")}
              >
                {labels.confirmResolved}
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                onClick={() => onSetCommentStatus(comment.id, "todo")}
              >
                {labels.requestMoreChanges}
              </button>
            </div>
          ) : null}
          {onSetCommentStatus && role === "creator" && comment.author === "brand" && comment.status !== "resolved" ? (
            <div className="mt-2">
              <button
                type="button"
                disabled={pending}
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                onClick={() => onSetCommentStatus(comment.id, "resolved")}
              >
                {labels.markPendingConfirmation}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
