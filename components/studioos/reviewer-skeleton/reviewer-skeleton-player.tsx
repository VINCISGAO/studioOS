import { Maximize, Pause, Play, Volume2 } from "lucide-react";
import type { ReviewerSkeletonMock } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-mock";
import type { Locale } from "@/lib/i18n";

export function ReviewerSkeletonPlayer({
  locale,
  mock
}: {
  locale: Locale;
  mock: ReviewerSkeletonMock;
}) {
  const progress = mock.durationSec > 0 ? (mock.currentSec / mock.durationSec) * 100 : 0;
  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-950 p-3">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-zinc-600/60 bg-zinc-900/70 p-5 text-zinc-300">
            <Play className="h-8 w-8" />
          </div>
        </div>
        <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs font-medium text-zinc-200">
          1080P
        </div>
      </div>
      <div className="rounded-lg bg-zinc-900/80 p-3 text-zinc-100">
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
          <span>{locale === "zh" ? "暂停后可留言" : "Pause to comment"}</span>
        </div>
        <div className="mb-3 h-1.5 rounded bg-zinc-700">
          <div className="h-full rounded bg-indigo-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            disabled
            className="rounded border border-zinc-600 p-1.5 text-zinc-300 opacity-60"
          >
            <Pause className="h-4 w-4" />
          </button>
          <span className="font-mono">
            {mock.currentTimeLabel} / {mock.durationLabel}
          </span>
          <span className="inline-flex items-center gap-1 text-zinc-400">
            <Volume2 className="h-4 w-4" />
            <span className="inline-block h-1 w-16 rounded bg-zinc-600" />
          </span>
          <span className="text-zinc-400">{locale === "zh" ? "倍速 1x" : "Speed 1x"}</span>
          <button type="button" disabled className="ml-auto rounded border border-zinc-600 p-1.5 opacity-60">
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
