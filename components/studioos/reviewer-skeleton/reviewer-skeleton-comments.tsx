import type { Locale } from "@/lib/i18n";
import type { ReviewerSkeletonMock } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-mock";

const filterLabels = {
  zh: { all: "全部", open: "待处理", resolved: "已解决", empty: "暂无评论", openStatus: "待处理", resolvedStatus: "已解决" },
  en: { all: "All", open: "Open", resolved: "Resolved", empty: "No comments yet", openStatus: "Open", resolvedStatus: "Resolved" }
};

export function ReviewerSkeletonCommentsPanel({
  locale,
  mock
}: {
  locale: Locale;
  mock: ReviewerSkeletonMock;
}) {
  const t = filterLabels[locale];
  return (
    <aside className="flex min-h-[560px] flex-col rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-3">
        <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 text-xs">
          <span className="rounded bg-white px-2 py-1 shadow-sm">{t.all}</span>
          <span className="rounded px-2 py-1 text-zinc-500">{t.open}</span>
          <span className="rounded px-2 py-1 text-zinc-500">{t.resolved}</span>
        </div>
      </div>
      <div className="border-b border-zinc-200 p-3">
        <textarea
          rows={3}
          disabled
          placeholder={mock.commentPlaceholder}
          className="w-full resize-none rounded border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm text-zinc-500 outline-none"
        />
        <button
          type="button"
          disabled
          className="mt-2 rounded bg-indigo-600/50 px-3 py-1.5 text-xs font-medium text-white"
        >
          {mock.sendLabel}
        </button>
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {mock.comments.length ? (
          mock.comments.map((comment) => (
            <li key={comment.id} className="rounded border border-zinc-200 p-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="font-mono text-indigo-600">{comment.timeLabel}</span>
                <span>{comment.author}</span>
                <span
                  className={`rounded px-1.5 py-0.5 ${
                    comment.status === "resolved"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {comment.status === "resolved" ? t.resolvedStatus : t.openStatus}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-800">{comment.body}</p>
            </li>
          ))
        ) : (
          <li className="py-8 text-center text-sm text-zinc-400">{t.empty}</li>
        )}
      </ul>
    </aside>
  );
}
