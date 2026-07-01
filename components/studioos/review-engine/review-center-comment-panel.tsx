"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Send, Trash2 } from "lucide-react";
import {
  addReviewCommentAction,
  deleteReviewCommentAction,
  resolveReviewCommentAction
} from "@/app/review-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Review comments",
    placeholder: "Add comment at current timestamp…",
    send: "Send",
    empty: "No comments yet",
    brand: "Brand",
    studio: "Studio",
    resolved: "Resolved",
    resolve: "Mark resolved",
    delete: "Delete",
    open: "Open"
  },
  zh: {
    title: "审片意见",
    placeholder: "在当前时间点添加评论…",
    send: "发送",
    empty: "暂无评论",
    brand: "品牌方",
    studio: "创作者",
    resolved: "已解决",
    resolve: "标记已解决",
    delete: "删除",
    open: "未解决"
  }
};

export function ReviewCenterCommentPanel({
  locale,
  role,
  orderId,
  activeVersion,
  currentSec,
  comments,
  activeCommentId,
  onCommentsChange,
  onSelectComment
}: {
  locale: Locale;
  role: "brand" | "creator";
  orderId: string;
  activeVersion: number;
  currentSec: number;
  comments: ReviewComment[];
  activeCommentId: string | null;
  onCommentsChange: (next: ReviewComment[]) => void;
  onSelectComment: (comment: ReviewComment) => void;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");

  const versionComments = [...comments.filter((item) => item.version === activeVersion)].sort(
    (a, b) => a.timestamp_sec - b.timestamp_sec
  );

  function handleSend() {
    if (!draft.trim() || role !== "brand") return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      fd.set("version", String(activeVersion));
      fd.set("timestamp_sec", String(currentSec));
      fd.set("body", draft.trim());
      const result = await addReviewCommentAction(fd);
      if (result.ok) {
        onCommentsChange([...comments, result.comment]);
        setDraft("");
        router.refresh();
      }
    });
  }

  function handleResolve(commentId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      fd.set("comment_id", commentId);
      const result = await resolveReviewCommentAction(fd);
      if (result.ok) {
        onCommentsChange(comments.map((item) => (item.id === commentId ? result.comment : item)));
        router.refresh();
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      fd.set("comment_id", commentId);
      const result = await deleteReviewCommentAction(fd);
      if (result.ok) {
        onCommentsChange(comments.filter((item) => item.id !== commentId));
        router.refresh();
      }
    });
  }

  return (
    <aside className="flex h-full min-h-[480px] flex-col rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">{t.title}</h3>
      </div>

      {role === "brand" ? (
        <div className="border-b border-zinc-100 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-2 font-mono text-xs font-semibold text-blue-600">
              {formatTimestamp(currentSec)}
            </span>
            <div className="min-w-0 flex-1">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                placeholder={t.placeholder}
                className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <Button
                type="button"
                size="sm"
                disabled={pending || !draft.trim()}
                onClick={handleSend}
                className="mt-2 rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t.send}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ul className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto">
        {versionComments.length ? (
          versionComments.map((comment, index) => {
            const active = activeCommentId === comment.id;
            return (
              <li key={comment.id} className={cn("p-4", active && "bg-blue-50/60")}>
                <button type="button" className="w-full text-left" onClick={() => onSelectComment(comment)}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-600">
                          {formatTimestamp(comment.timestamp_sec)}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {comment.author === "brand" ? t.brand : t.studio}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            comment.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          )}
                        >
                          {comment.status === "resolved" ? t.resolved : t.open}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-800">{comment.body}</p>
                    </div>
                  </div>
                </button>
                <div className="mt-3 flex items-center gap-2 pl-9">
                  {role === "creator" && comment.status === "open" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => handleResolve(comment.id)}
                      className="h-8 rounded-lg border-zinc-200 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t.resolve}
                    </Button>
                  ) : null}
                  {role === "brand" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => handleDelete(comment.id)}
                      className="h-8 rounded-lg text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.delete}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })
        ) : (
          <li className="px-4 py-12 text-center text-sm text-zinc-400">{t.empty}</li>
        )}
      </ul>
    </aside>
  );
}
