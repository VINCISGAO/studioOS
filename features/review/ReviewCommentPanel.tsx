"use client";

import { ArrowRight, Circle, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { ReviewAnnotation, ReviewComment, ReviewTool } from "@/features/review/review.types";
import { formatReviewTime } from "@/features/review/review-format";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Review notes",
    placeholder: "Describe what should change at this timestamp…",
    publish: "Post note",
    empty: "No notes yet",
    tools: "Draw on frame",
    circle: "Circle",
    rect: "Box",
    arrow: "Arrow",
    pending: (n: number) => `${n} mark${n === 1 ? "" : "s"} on frame`,
    readOnly: "Tap a note to jump to its timestamp and see marks."
  },
  zh: {
    title: "审片意见",
    placeholder: "说明这一秒画面需要修改的内容…",
    publish: "发布意见",
    empty: "暂无评论",
    tools: "在画面上标注",
    circle: "圆圈",
    rect: "方框",
    arrow: "箭头",
    pending: (n: number) => `已标注 ${n} 处`,
    readOnly: "点击评论可跳转到对应秒数并查看标注。"
  }
};

const toolItems: { id: NonNullable<ReviewTool>; icon: typeof Circle; labelKey: "circle" | "rect" | "arrow" }[] = [
  { id: "circle", icon: Circle, labelKey: "circle" },
  { id: "rect", icon: Square, labelKey: "rect" },
  { id: "arrow", icon: ArrowRight, labelKey: "arrow" }
];

export function ReviewCommentPanel({
  locale,
  role,
  currentTime,
  comments,
  activeCommentId,
  draftComment,
  pendingAnnotations,
  activeTool,
  canCompose,
  onDraftChange,
  onToolChange,
  onPublish,
  onSelectComment
}: {
  locale: Locale;
  role: "brand" | "creator";
  currentTime: number;
  comments: ReviewComment[];
  activeCommentId: string | null;
  draftComment: string;
  pendingAnnotations: ReviewAnnotation[];
  activeTool: ReviewTool;
  canCompose: boolean;
  onDraftChange: (value: string) => void;
  onToolChange: (tool: ReviewTool) => void;
  onPublish: () => void;
  onSelectComment: (comment: ReviewComment) => void;
}) {
  const t = copy[locale];
  const sorted = [...comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <aside className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-950">{t.title}</h3>
        {role === "creator" ? <p className="mt-1 text-xs text-zinc-500">{t.readOnly}</p> : null}
      </div>

      {role === "brand" && canCompose ? (
        <div className="space-y-3 border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold tabular-nums text-[#5B5CFF]">
              {formatReviewTime(currentTime)}
            </span>
            <span className="text-xs text-zinc-400">{t.tools}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {toolItems.map(({ id, icon: Icon, labelKey }) => (
              <button
                key={id}
                type="button"
                onClick={() => onToolChange(activeTool === id ? null : id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  activeTool === id
                    ? "bg-[#5B5CFF] text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t[labelKey]}
              </button>
            ))}
          </div>

          {pendingAnnotations.length ? (
            <p className="text-xs font-medium text-[#5B5CFF]">{t.pending(pendingAnnotations.length)}</p>
          ) : null}

          <textarea
            value={draftComment}
            onChange={(event) => onDraftChange(event.target.value)}
            rows={4}
            placeholder={t.placeholder}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2.5 text-sm outline-none transition focus:border-[#5B5CFF]/40 focus:bg-white focus:ring-2 focus:ring-[#5B5CFF]/10"
          />

          <Button
            type="button"
            disabled={!draftComment.trim()}
            onClick={onPublish}
            className="h-10 w-full rounded-xl bg-[#5B5CFF] hover:bg-[#4a4bef]"
          >
            <Send className="h-4 w-4" />
            {t.publish}
          </Button>
        </div>
      ) : null}

      <ul className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto">
        {sorted.length ? (
          sorted.map((comment) => {
            const active = activeCommentId === comment.id;
            return (
              <li key={comment.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full px-5 py-4 text-left transition",
                    active ? "bg-[#5B5CFF]/5" : "hover:bg-zinc-50"
                  )}
                  onClick={() => onSelectComment(comment)}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-[#5B5CFF]">
                      {formatReviewTime(comment.time)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-500">{comment.createdBy}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-800">{comment.content}</p>
                      {comment.annotations.length ? (
                        <p className="mt-2 text-[11px] font-medium text-zinc-400">
                          {comment.annotations.length} {locale === "zh" ? "处标注" : "mark(s)"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            );
          })
        ) : (
          <li className="px-5 py-16 text-center text-sm text-zinc-400">{t.empty}</li>
        )}
      </ul>
    </aside>
  );
}
