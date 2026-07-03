"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { ReviewerCommentDeleteDialog } from "@/components/studioos/reviewer-skeleton/reviewer-comment-delete-dialog";
import { ReviewerCommentDeletedToast } from "@/components/studioos/reviewer-skeleton/reviewer-comment-deleted-toast";
import { ReviewerStageLockedDialog } from "@/components/studioos/reviewer-skeleton/reviewer-stage-locked-dialog";
import {
  ReviewerCommentEmojiPicker,
  insertTextAtCursor
} from "@/components/studioos/reviewer-skeleton/reviewer-comment-emoji-picker";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment, ReviewCommentStatus } from "@/lib/studioos/review-comment-types";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    all: "全部",
    pending: "待处理",
    resolved: "已解决",
    empty: "暂无评论",
    todoStatus: "待处理",
    inProgressStatus: "处理中",
    pendingConfirmationStatus: "待确认",
    resolvedStatus: "已解决",
    reply: "回复",
    placeholder: "添加评论…",
    replyPlaceholder: "回复 Brand 批注…",
    brandOnly: "仅品牌方可留言",
    pauseToComment: "请先暂停视频再评论",
    send: "发送",
    deleteComment: "删除评论",
    confirmResolved: "确认解决",
    requestMoreChanges: "仍需修改",
    markInProgress: "标记处理中",
    markPendingConfirmation: "标记已处理",
    handledHint: "用于记录本轮批注是否已处理",
    creatorNoComposer: "请回复 Brand 批注或更新处理状态"
  },
  en: {
    all: "All",
    pending: "Pending",
    resolved: "Resolved",
    empty: "No comments yet",
    todoStatus: "To do",
    inProgressStatus: "In progress",
    pendingConfirmationStatus: "To confirm",
    resolvedStatus: "Resolved",
    reply: "Reply",
    placeholder: "Add a comment…",
    replyPlaceholder: "Reply to Brand feedback…",
    brandOnly: "Only the brand can comment",
    pauseToComment: "Pause the video to comment",
    send: "Send",
    deleteComment: "Delete comment",
    confirmResolved: "Confirm resolved",
    requestMoreChanges: "Needs changes",
    markInProgress: "Mark in progress",
    markPendingConfirmation: "Mark handled",
    handledHint: "Track whether this note has been handled.",
    creatorNoComposer: "Reply to Brand notes or update their status."
  }
};

function markerColor(index: number) {
  const colors = ["bg-orange-500", "bg-violet-500", "bg-emerald-500", "bg-sky-500"];
  return colors[(index - 1) % colors.length];
}

function placeholderText(
  locale: Locale,
  role: "brand" | "creator",
  canComment: boolean,
  isPlaying: boolean,
  disabledMessage?: string
) {
  const t = copy[locale];
  if (disabledMessage) return disabledMessage;
  if (role === "creator") return canComment ? t.replyPlaceholder : t.brandOnly;
  if (isPlaying) return t.pauseToComment;
  if (canComment) return t.placeholder;
  return t.pauseToComment;
}

export function ReviewerFocusCommentsPanel({
  locale,
  role,
  comments,
  draftBody,
  canComment,
  disabledMessage,
  isPlaying,
  pending,
  activeCommentId,
  onDraftBodyChange,
  onSubmit,
  onSelectComment,
  onDeleteComment,
  onSetCommentStatus,
  deletedToast,
  footerActions,
  className
}: {
  locale: Locale;
  role: "brand" | "creator";
  comments: ReviewComment[];
  draftBody: string;
  canComment: boolean;
  disabledMessage?: string;
  isPlaying: boolean;
  pending: boolean;
  activeCommentId: string | null;
  onDraftBodyChange: (value: string) => void;
  onSubmit: () => void;
  onSelectComment: (comment: ReviewComment) => void;
  onDeleteComment?: (commentId: string) => void;
  onSetCommentStatus?: (commentId: string, status: ReviewCommentStatus) => void;
  deletedToast?: string | null;
  footerActions?: ReactNode;
  className?: string;
}) {
  const t = copy[locale];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"all" | "pending" | "resolved">("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);
  const pendingCount = comments.filter((item) => item.status !== "resolved").length;
  const resolvedCount = comments.filter((item) => item.status === "resolved").length;
  const inputDisabled = !canComment || pending;
  const textareaDisabled = pending || (!canComment && !disabledMessage);

  const visible = useMemo(() => {
    if (tab === "pending") return comments.filter((item) => item.status !== "resolved");
    if (tab === "resolved") return comments.filter((item) => item.status === "resolved");
    return comments;
  }, [comments, tab]);

  const numbered = useMemo(
    () =>
      [...comments]
        .sort((a, b) => a.timestamp_sec - b.timestamp_sec || a.created_at.localeCompare(b.created_at))
        .reduce<Record<string, number>>((acc, comment, index) => {
          acc[comment.id] = index + 1;
          return acc;
        }, {}),
    [comments]
  );

  function handleEmojiPick(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      onDraftBodyChange(draftBody + emoji);
      return;
    }
    const { next, cursor } = insertTextAtCursor(
      draftBody,
      emoji,
      el.selectionStart ?? draftBody.length,
      el.selectionEnd ?? draftBody.length
    );
    onDraftBodyChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col bg-white",
        className
      )}
    >
      <ReviewerCommentDeleteDialog
        locale={locale}
        open={deleteTargetId !== null}
        pending={pending}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        onConfirm={() => {
          if (!deleteTargetId || !onDeleteComment) return;
          onDeleteComment(deleteTargetId);
          setDeleteTargetId(null);
        }}
      />

      <div className="shrink-0 border-b border-zinc-100 p-3">
        <div className="mb-3 flex items-center gap-1 text-xs">
          {(
            [
              ["all", t.all, comments.length],
              ["resolved", t.resolved, resolvedCount],
              ["pending", t.pending, pendingCount]
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-medium transition",
                tab === key ? "bg-violet-600 text-white" : "text-zinc-500 hover:bg-zinc-100"
              )}
            >
              {label}
              {key !== "all" ? ` ${count}` : ""}
            </button>
          ))}
        </div>
      </div>

      {deletedToast ? (
        <div className="shrink-0 border-b border-zinc-100 px-3 py-2">
          <ReviewerCommentDeletedToast message={deletedToast} />
        </div>
      ) : null}

      <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto">
        {visible.length ? (
          visible.map((comment) => {
            const name = comment.author_display_name ?? comment.author;
            const marker = numbered[comment.id];
            return (
              <li
                key={comment.id}
                className={cn(
                  "border-b border-zinc-100 px-4 py-3 transition",
                  activeCommentId === comment.id ? "bg-violet-50/50" : "hover:bg-zinc-50/80"
                )}
              >
                <div className="flex items-start gap-2">
                  {marker ? (
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                        markerColor(marker)
                      )}
                    >
                      {marker}
                    </span>
                  ) : null}
                  <div
                    role="button"
                    tabIndex={0}
                    className="min-w-0 flex-1 cursor-pointer text-left"
                    onClick={() => onSelectComment(comment)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectComment(comment);
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">{name}</span>
                      <span className="font-mono text-xs text-violet-600">
                        {formatTimestamp(comment.timestamp_sec)}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          comment.status === "resolved"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80"
                            : comment.status === "pending_confirmation"
                              ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200/80"
                              : comment.status === "in_progress"
                                ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80"
                        )}
                      >
                        {comment.status === "resolved"
                          ? t.resolvedStatus
                          : comment.status === "pending_confirmation"
                            ? t.pendingConfirmationStatus
                            : comment.status === "in_progress"
                              ? t.inProgressStatus
                              : t.todoStatus}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                      {comment.body}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {role === "brand" ? (
                        <span className="rounded-md px-0.5 text-xs font-medium text-violet-600 underline-offset-2 hover:underline">
                          {t.reply}
                        </span>
                      ) : null}
                      {onSetCommentStatus && role === "brand" && comment.status === "pending_confirmation" ? (
                        <>
                          <button
                            type="button"
                            disabled={pending}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSetCommentStatus(comment.id, "resolved");
                            }}
                          >
                            {t.confirmResolved}
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSetCommentStatus(comment.id, "todo");
                            }}
                          >
                            {t.requestMoreChanges}
                          </button>
                        </>
                      ) : null}
                      {onSetCommentStatus && role === "creator" && comment.author === "brand" && comment.status !== "resolved" ? (
                        <div className="mt-1 w-full">
                          <p className="mb-1 text-[11px] text-zinc-400">{t.handledHint}</p>
                          <button
                            type="button"
                            disabled={pending}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSetCommentStatus(comment.id, "resolved");
                            }}
                          >
                            {t.markPendingConfirmation}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {role === "brand" && onDeleteComment ? (
                    <button
                      type="button"
                      aria-label={t.deleteComment}
                      disabled={pending}
                      className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTargetId(comment.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })
        ) : (
          <li className="px-4 py-16 text-center text-sm text-zinc-400">{t.empty}</li>
        )}
      </ul>

      <div className="shrink-0 border-t border-zinc-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {role === "creator" ? (
          <p className="mb-2 text-xs leading-5 text-zinc-500">{t.creatorNoComposer}</p>
        ) : null}
        <textarea
          ref={textareaRef}
          rows={3}
          value={draftBody}
          disabled={textareaDisabled}
          readOnly={Boolean(disabledMessage)}
          placeholder={placeholderText(locale, role, canComment, isPlaying, disabledMessage)}
          className={cn(
            "w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-zinc-50 disabled:opacity-60",
            disabledMessage ? "cursor-not-allowed bg-zinc-50 text-zinc-500" : ""
          )}
          onClick={() => {
            if (disabledMessage) setLockedDialogOpen(true);
          }}
          onChange={(event) => onDraftBodyChange(event.target.value)}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <ReviewerCommentEmojiPicker disabled={inputDisabled} onPick={handleEmojiPick} />
          <button
            type="button"
            disabled={inputDisabled || !draftBody.trim()}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
            onClick={onSubmit}
          >
            {t.send}
          </button>
        </div>
      </div>
      {footerActions ? (
        <div className="shrink-0 border-t border-zinc-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footerActions}
        </div>
      ) : null}
      <ReviewerStageLockedDialog
        locale={locale}
        kind="comment"
        message={disabledMessage}
        open={lockedDialogOpen}
        onOpenChange={setLockedDialogOpen}
      />
    </aside>
  );
}
