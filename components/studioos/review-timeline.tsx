import type { Locale } from "@/lib/i18n";

export type ReviewComment = {
  id: string;
  timestamp: string;
  body: string;
};

const demoComments: ReviewComment[] = [
  { id: "1", timestamp: "00:03", body: "Logo too small." },
  { id: "2", timestamp: "00:08", body: "Music stronger." },
  { id: "3", timestamp: "00:13", body: "Change CTA." }
];

export function ReviewTimeline({ locale }: { locale: Locale }) {
  return (
    <div className="space-y-4">
      <div className="aspect-video overflow-hidden rounded-xl bg-zinc-900">
        <div className="flex h-full items-center justify-center text-sm text-zinc-400">
          {locale === "zh" ? "视频预览 · 时间轴审片" : "Video preview · timeline review"}
        </div>
      </div>
      <div className="divide-y rounded-xl border bg-white">
        {demoComments.map((comment) => (
          <div key={comment.id} className="flex gap-4 px-4 py-4">
            <span className="shrink-0 font-mono text-sm font-semibold text-zinc-900">{comment.timestamp}</span>
            <p className="text-sm text-zinc-600">{comment.body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        {locale === "zh"
          ? "Review Center 用时间轴替代聊天，所有修改锚定在画面上。"
          : "Review Center replaces chat — every note anchors to a moment on the timeline."}
      </p>
    </div>
  );
}
