"use client";

import { useMemo, useState } from "react";
import { Filter, MessageSquarePlus, Paperclip, Smile, Trash2 } from "lucide-react";
import { ReviewerCommentDeleteDialog } from "@/components/studioos/reviewer-skeleton/reviewer-comment-delete-dialog";
import { ReviewerCommentDeletedToast } from "@/components/studioos/reviewer-skeleton/reviewer-comment-deleted-toast";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    all: "全部",
    open: "待处理",
    resolved: "已解决",
    empty: "暂无评论",
    openStatus: "待处理",
    resolvedStatus: "已解决",
    send: "发送",
    brandOnly: "仅品牌方可留言",
    pauseToComment: "请先暂停视频再评论",
    placeholder: "添加评论…",
    atTimestamp: (time: string) => `将在 ${time} 添加评论`,
    members: "全部成员",
    reply: "回复",
    deleteComment: "删除评论"
  },
  en: {
    all: "All",
    open: "Pending",
    resolved: "Resolved",
    empty: "No comments yet",
    openStatus: "Pending",
    resolvedStatus: "Resolved",
    send: "Send",
    brandOnly: "Only the brand can comment",
    pauseToComment: "Pause the video to comment",
    placeholder: "Add a comment…",
    atTimestamp: (time: string) => `Comment at ${time}`,
    members: "All members",
    reply: "Reply",
    deleteComment: "Delete comment"
  }
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function placeholderText(
  locale: Locale,
  role: "brand" | "creator",
  canComment: boolean,
  isPlaying: boolean
) {
  const t = copy[locale];
  if (role === "creator") return t.brandOnly;
  if (isPlaying) return t.pauseToComment;
  if (canComment) return t.placeholder;
  return t.pauseToComment;
}

export function ReviewerTimestampComments({
  locale,
  role,
  compact = false,
  comments,
  draftBody,
  canComment,
  isPlaying,
  pending,
  activeCommentId,
  commentTimestampSec,
  onDraftBodyChange,
  onSubmit,
  onSelectComment,
  onDeleteComment,
  deletedToast
}: {
  locale: Locale;
  role: "brand" | "creator";
  compact?: boolean;
  comments: ReviewComment[];
  draftBody: string;
  canComment: boolean;
  isPlaying: boolean;
  pending: boolean;
  activeCommentId: string | null;
  commentTimestampSec: number;
  onDraftBodyChange: (value: string) => void;
  onSubmit: () => void;
  onSelectComment: (comment: ReviewComment) => void;
  onDeleteComment?: (commentId: string) => void;
  deletedToast?: string | null;
}) {
  const t = copy[locale];
  const [tab, setTab] = useState<"all" | "open" | "resolved">("all");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const openCount = comments.filter((item) => item.status !== "resolved").length;
  const resolvedCount = comments.filter((item) => item.status === "resolved").length;

  const visible = useMemo(() => {
    if (tab === "open") return comments.filter((item) => item.status !== "resolved");
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

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm",
        compact ? "h-full min-h-0" : "max-h-[calc(100vh-8rem)] min-h-[640px]"
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

      <div className={cn("border-b border-zinc-100", compact ? "p-2" : "p-3")}>
        <div className={cn("flex items-center gap-1 text-xs", compact ? "mb-2" : "mb-3")}>
          {(
            [
              ["all", t.all, comments.length],
              ["open", t.open, openCount],
              ["resolved", t.resolved, resolvedCount]
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
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <select className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 outline-none">
            <option>{t.members}</option>
          </select>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200">
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {deletedToast ? (
        <div className={cn("shrink-0 border-b border-zinc-100", compact ? "px-2 pb-2 pt-1" : "px-3 pb-3 pt-1")}>
          <ReviewerCommentDeletedToast message={deletedToast} />
        </div>
      ) : null}

      <div className={cn("border-b border-zinc-100", compact ? "p-2" : "p-3")}>
        <textarea
          rows={compact ? 2 : 3}
          value={draftBody}
          disabled={!canComment || pending}
          placeholder={placeholderText(locale, role, canComment, isPlaying)}
          className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400 disabled:bg-zinc-50"
          onChange={(event) => onDraftBodyChange(event.target.value)}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-zinc-400">
            <button type="button" disabled className="rounded p-1.5 hover:bg-zinc-100 disabled:opacity-40">
              <MessageSquarePlus className="h-4 w-4" />
            </button>
            <button type="button" disabled className="rounded p-1.5 hover:bg-zinc-100 disabled:opacity-40">
              <Smile className="h-4 w-4" />
            </button>
            <button type="button" disabled className="rounded p-1.5 hover:bg-zinc-100 disabled:opacity-40">
              <Paperclip className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            disabled={!canComment || pending || !draftBody.trim()}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            onClick={onSubmit}
          >
            {t.send}
          </button>
        </div>
        {canComment && !compact ? (
          <p className="mt-2 text-[11px] text-zinc-500">{t.atTimestamp(formatTimestamp(commentTimestampSec))}</p>
        ) : null}
      </div>

      <ul className={cn("min-h-0 flex-1 space-y-3 overflow-y-auto", compact ? "p-2" : "p-3")}>
        {visible.length ? (
          visible.map((comment) => {
            const name = comment.author_display_name ?? comment.author;
            return (
              <li
                key={comment.id}
                className={cn(
                  "rounded-xl border p-3 transition",
                  activeCommentId === comment.id
                    ? "border-violet-300 bg-violet-50/40"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <div className="flex items-start gap-1">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelectComment(comment)}
                  >
                    <div className="flex items-start gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                        {initials(name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900">{name}</span>
                          <span className="font-mono text-xs text-violet-600">
                            {formatTimestamp(comment.timestamp_sec)}
                          </span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium",
                              comment.status === "resolved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {comment.status === "resolved" ? t.resolvedStatus : t.openStatus}
                          </span>
                          {numbered[comment.id] ? (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                              {numbered[comment.id]}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-800">{comment.body}</p>
                        <span className="mt-2 inline-block text-xs font-medium text-violet-600">{t.reply}</span>
                      </div>
                    </div>
                  </button>
                  {role === "brand" && onDeleteComment ? (
                    <button
                      type="button"
                      aria-label={t.deleteComment}
                      disabled={pending}
                      className="mt-0.5 shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTargetId(comment.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })
        ) : (
          <li className="py-12 text-center text-sm text-zinc-400">{t.empty}</li>
        )}
      </ul>
    </aside>
  );
}
