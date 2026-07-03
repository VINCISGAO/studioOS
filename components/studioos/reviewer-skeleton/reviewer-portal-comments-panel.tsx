"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { ReviewerCommentDeleteDialog } from "@/components/studioos/reviewer-skeleton/reviewer-comment-delete-dialog";
import { ReviewerCommentDeletedToast } from "@/components/studioos/reviewer-skeleton/reviewer-comment-deleted-toast";
import { ReviewerPortalCommentCard } from "@/components/studioos/reviewer-skeleton/reviewer-portal-comment-card";
import { ReviewerStageLockedDialog } from "@/components/studioos/reviewer-skeleton/reviewer-stage-locked-dialog";
import {
  ReviewerCommentEmojiPicker,
  insertTextAtCursor
} from "@/components/studioos/reviewer-skeleton/reviewer-comment-emoji-picker";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment, ReviewCommentStatus } from "@/lib/studioos/review-comment-types";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    allMembers: "全部成员",
    annotations: "批注",
    allAnnotations: "全部批注",
    statusFilter: "状态筛选",
    activity: "动态",
    activityEmpty: "暂无动态",
    filterAllStatus: "全部状态",
    all: "全部",
    empty: "暂无批注",
    todoStatus: "待处理",
    inProgressStatus: "处理中",
    pendingConfirmationStatus: "待确认",
    resolvedStatus: "已处理",
    reply: "回复",
    placeholder: "写下批注...",
    pauseToComment: "请先暂停视频再批注",
    send: "发送",
    deleteComment: "删除批注",
    confirmResolved: "确认解决",
    requestMoreChanges: "仍需修改",
    markInProgress: "标记处理中",
    markPendingConfirmation: "标记已处理",
    creatorNoComposer: "请回复 Brand 批注或更新处理状态",
    replyPlaceholder: "回复 Brand 批注…",
    replyPrompt: "点击 Brand 批注上的「回复」进行回复",
    replyingTo: "正在回复"
  },
  en: {
    allMembers: "All members",
    annotations: "Notes",
    allAnnotations: "All notes",
    statusFilter: "Status",
    activity: "Activity",
    activityEmpty: "No activity yet",
    filterAllStatus: "All statuses",
    all: "All",
    empty: "No notes yet",
    todoStatus: "To do",
    inProgressStatus: "In progress",
    pendingConfirmationStatus: "To confirm",
    resolvedStatus: "Handled",
    reply: "Reply",
    placeholder: "Write a note…",
    pauseToComment: "Pause the video to annotate",
    send: "Send",
    deleteComment: "Delete comment",
    confirmResolved: "Confirm resolved",
    requestMoreChanges: "Needs changes",
    markInProgress: "Mark in progress",
    markPendingConfirmation: "Mark handled",
    creatorNoComposer: "Reply to Brand notes or update their status.",
    replyPlaceholder: "Reply to Brand feedback…",
    replyPrompt: "Use Reply on a Brand note to respond",
    replyingTo: "Replying to"
  }
};

function statusLabel(locale: Locale, status: ReviewCommentStatus) {
  const t = copy[locale];
  if (status === "resolved") return t.resolvedStatus;
  if (status === "pending_confirmation") return t.pendingConfirmationStatus;
  if (status === "in_progress") return t.inProgressStatus;
  return t.todoStatus;
}

export function ReviewerPortalCommentsPanel({
  locale,
  role,
  comments,
  draftBody,
  canComment,
  canReply,
  disabledMessage,
  isPlaying,
  pending,
  activeCommentId,
  replyTargetId,
  replyTargetComment,
  onDraftBodyChange,
  onSubmit,
  onSelectComment,
  onStartReply,
  onCancelReply,
  onDeleteComment,
  onSetCommentStatus,
  deletedToast,
  className,
  variant = "portal",
  focusTheme = "dark",
  mobileFixedFooter = false
}: {
  locale: Locale;
  role: "brand" | "creator";
  comments: ReviewComment[];
  draftBody: string;
  canComment: boolean;
  canReply: boolean;
  disabledMessage?: string;
  isPlaying: boolean;
  pending: boolean;
  activeCommentId: string | null;
  replyTargetId: string | null;
  replyTargetComment: ReviewComment | null;
  onDraftBodyChange: (value: string) => void;
  onSubmit: () => void;
  onSelectComment: (comment: ReviewComment) => void;
  onStartReply: (comment: ReviewComment) => void;
  onCancelReply: () => void;
  onDeleteComment?: (commentId: string) => void;
  onSetCommentStatus?: (commentId: string, status: ReviewCommentStatus) => void;
  deletedToast?: string | null;
  className?: string;
  variant?: "portal" | "focus";
  focusTheme?: "light" | "dark";
  mobileFixedFooter?: boolean;
}) {
  const t = copy[locale];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "resolved" | "pending">("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const canCompose =
    role === "brand" ? canComment : canReply && replyTargetId !== null;
  const inputDisabled = !canCompose || pending;
  const textareaDisabled =
    pending || (role === "creator" && !replyTargetId) || (!canCompose && !disabledMessage);

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

  const resolvedCount = useMemo(
    () => comments.filter((item) => item.status === "resolved").length,
    [comments]
  );
  const pendingCount = useMemo(
    () => comments.filter((item) => item.status !== "resolved").length,
    [comments]
  );

  const visible = useMemo(() => {
    if (statusFilter === "all") return comments;
    if (statusFilter === "resolved") return comments.filter((item) => item.status === "resolved");
    return comments.filter((item) => item.status !== "resolved");
  }, [comments, statusFilter]);

  const statusFilters: Array<{
    key: "all" | "resolved" | "pending";
    label: string;
    count: number;
  }> = [
    { key: "all", label: t.all, count: comments.length },
    { key: "resolved", label: t.resolvedStatus, count: resolvedCount },
    { key: "pending", label: t.todoStatus, count: pendingCount }
  ];

  const emptyMessage =
    statusFilter === "resolved"
      ? locale === "zh"
        ? "暂无已处理批注"
        : "No handled notes"
      : statusFilter === "pending"
        ? locale === "zh"
          ? "暂无待处理批注"
          : "No pending notes"
        : t.empty;

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

  const placeholder = disabledMessage
    ? disabledMessage
    : role === "creator"
      ? replyTargetId
        ? t.replyPlaceholder
        : t.replyPrompt
      : isPlaying
        ? t.pauseToComment
        : canComment
          ? t.placeholder
          : t.pauseToComment;

  const isDark = variant === "focus" && focusTheme === "dark";

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-l",
        isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white",
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

      <div className={cn("shrink-0 border-b", isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white")}>
        {isDark ? (
          <div className="px-3 py-2 md:py-2">
            <div
              role="tablist"
              aria-label={t.annotations}
              className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-900 p-1"
            >
              {statusFilters.map((item) => {
                const active = statusFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(item.key)}
                    className={cn(
                      "rounded-lg px-2 py-2 text-center transition",
                      active
                        ? "bg-zinc-800 text-violet-300 shadow-sm ring-1 ring-violet-500/30"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <span className="block truncate text-xs font-medium">{item.label}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[11px] tabular-nums",
                        active ? "text-violet-400" : "text-zinc-600"
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 pt-3 md:px-3 md:pt-2">
              <div
                role="tablist"
                aria-label={locale === "zh" ? "批注筛选" : "Note filters"}
                className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1"
              >
                {statusFilters.map((item) => {
                  const active = statusFilter === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStatusFilter(item.key)}
                      className={cn(
                        "rounded-lg px-2 py-2 text-center transition",
                        active
                          ? "bg-white text-violet-700 shadow-sm ring-1 ring-violet-100"
                          : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      <span className="block truncate text-xs font-medium">{item.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[11px] tabular-nums",
                          active ? "text-violet-600" : "text-zinc-400"
                        )}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              className={cn(
                "hidden items-center gap-2 px-4 py-2.5 md:px-5",
                variant === "focus" ? "lg:flex" : "sm:flex"
              )}
            >
              <label className="relative inline-flex min-w-0 flex-1 items-center">
                <select
                  className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-xs font-medium text-zinc-700 outline-none"
                  defaultValue="all"
                >
                  <option value="all">{t.allMembers}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-zinc-400" />
              </label>
              <button
                type="button"
                aria-label={t.statusFilter}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {deletedToast ? (
        <div className={cn("shrink-0 border-b px-3 py-2", isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-100 bg-white")}>
          <ReviewerCommentDeletedToast message={deletedToast} />
        </div>
      ) : null}

      <ul
        className={cn(
          "min-h-0 flex-1 space-y-3 overflow-y-auto p-3",
          mobileFixedFooter &&
            "max-lg:pb-[calc(10.5rem+env(safe-area-inset-bottom))] max-lg:overscroll-contain"
        )}
      >
        {visible.length ? (
          visible.map((comment) => (
            <li key={comment.id}>
              <ReviewerPortalCommentCard
                locale={locale}
                role={role}
                variant={isDark ? "focus" : "portal"}
                comment={comment}
                marker={numbered[comment.id]}
                active={activeCommentId === comment.id}
                pending={pending}
                menuOpen={menuOpenId === comment.id}
                labels={{
                  reply: t.reply,
                  deleteComment: t.deleteComment,
                  status: statusLabel(locale, comment.status),
                  confirmResolved: t.confirmResolved,
                  requestMoreChanges: t.requestMoreChanges,
                  markInProgress: t.markInProgress,
                  markPendingConfirmation: t.markPendingConfirmation
                }}
                onSelect={() => onSelectComment(comment)}
                onToggleMenu={() => setMenuOpenId(menuOpenId === comment.id ? null : comment.id)}
                canDelete={Boolean(onDeleteComment)}
                onDelete={() => {
                  if (!onDeleteComment) return;
                  setMenuOpenId(null);
                  setDeleteTargetId(comment.id);
                }}
                onSetCommentStatus={onSetCommentStatus}
                showReply={role === "creator" && comment.author === "brand"}
                replyActive={replyTargetId === comment.id}
                onReply={() => {
                  onStartReply(comment);
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }}
              />
            </li>
          ))
        ) : (
          <li
            className={cn(
              "rounded-xl border border-dashed px-4 py-12 text-center text-sm",
              mobileFixedFooter && "max-lg:flex max-lg:min-h-full max-lg:items-center max-lg:justify-center",
              isDark ? "border-zinc-700 bg-zinc-900/50 text-zinc-500" : "border-zinc-200 bg-white text-zinc-400"
            )}
          >
            {emptyMessage}
          </li>
        )}
      </ul>

      <div
        className={cn(
          "shrink-0 border-t p-3",
          isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white",
          mobileFixedFooter &&
            "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-[calc(3.25rem+env(safe-area-inset-bottom))] max-lg:z-30 max-lg:shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        )}
      >
        {role === "creator" ? (
          <p className={cn("mb-2 text-xs", isDark ? "text-zinc-500" : "text-zinc-500")}>{t.creatorNoComposer}</p>
        ) : null}
        {role === "creator" && replyTargetComment ? (
          <div
            className={cn(
              "mb-2 flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-xs",
              isDark ? "bg-violet-500/10 text-violet-300" : "bg-violet-50 text-violet-700"
            )}
          >
            <p className="min-w-0 leading-5">
              <span className="font-medium">{t.replyingTo}</span>
              <span className={cn("ml-1", isDark ? "text-zinc-400" : "text-zinc-600")}>
                {replyTargetComment.body}
              </span>
            </p>
            <button
              type="button"
              className={cn(
                "shrink-0 font-medium hover:underline",
                isDark ? "text-violet-300" : "text-violet-700"
              )}
              onClick={onCancelReply}
            >
              {locale === "zh" ? "取消" : "Cancel"}
            </button>
          </div>
        ) : null}
        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border px-3 py-2",
            isDark ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-zinc-50"
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={draftBody}
            disabled={textareaDisabled}
            readOnly={Boolean(disabledMessage)}
            placeholder={placeholder}
            className={cn(
              "min-h-[36px] flex-1 resize-none bg-transparent text-sm outline-none disabled:opacity-60",
              isDark ? "text-zinc-100 placeholder:text-zinc-500" : "placeholder:text-zinc-400",
              disabledMessage ? "cursor-not-allowed text-zinc-500" : ""
            )}
            onClick={() => {
              if (disabledMessage) setLockedDialogOpen(true);
            }}
            onChange={(event) => onDraftBodyChange(event.target.value)}
          />
          <ReviewerCommentEmojiPicker disabled={inputDisabled} onPick={handleEmojiPick} />
          <button
            type="button"
            disabled={inputDisabled || !draftBody.trim()}
            className="shrink-0 rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            onClick={onSubmit}
          >
            {t.send}
          </button>
        </div>
      </div>

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
