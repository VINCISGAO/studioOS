"use client";

import { ChevronRight } from "lucide-react";
import {
  ReviewerFilmstripLoadingSkeleton,
  ReviewerRailShimmer
} from "@/components/studioos/reviewer-skeleton/reviewer-media-rail-skeleton";
import { useReviewerFilmstripFrames } from "@/components/studioos/reviewer-skeleton/use-reviewer-filmstrip-frames";
import type { ReviewerVideoStatus } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import { timelineSecToPercent } from "@/lib/studioos/review-timeline";
import { cn } from "@/lib/utils";

const FRAME_COUNT = 24;

export function ReviewerTimestampFilmstrip({
  compact = false,
  focusLayout = false,
  focusDark = false,
  portalLayout = false,
  tabletCompact = false,
  videoUrl,
  playbackVersion = 1,
  videoStatus = "ready",
  durationSec,
  currentSec,
  onSeek
}: {
  compact?: boolean;
  focusLayout?: boolean;
  focusDark?: boolean;
  portalLayout?: boolean;
  tabletCompact?: boolean;
  videoUrl?: string;
  playbackVersion?: number;
  videoStatus?: ReviewerVideoStatus;
  durationSec: number;
  currentSec: number;
  onSeek: (sec: number) => void;
}) {
  const { frames, frameTimeSec } = useReviewerFilmstripFrames(
    videoUrl ?? "",
    durationSec,
    playbackVersion,
    FRAME_COUNT
  );
  const hasDuration = durationSec > 0;
  const isLoading = videoStatus === "loading" || (!hasDuration && videoStatus === "ready");
  const playhead = timelineSecToPercent(currentSec, durationSec);
  const activeIndex = hasDuration
    ? Math.min(FRAME_COUNT - 1, Math.floor((currentSec / durationSec) * FRAME_COUNT))
    : 0;
  const isCompact = Boolean(compact);
  const thumbSizeClass = focusLayout
    ? tabletCompact
      ? "h-8 w-8 rounded-md lg:h-16 lg:w-16 lg:rounded-lg"
      : "h-16 w-16 rounded-lg"
    : isCompact
      ? "h-10 w-[42px] rounded-md"
      : portalLayout
        ? "h-16 w-[72px] rounded-md"
        : "h-14 w-[58px] rounded-md";

  if (isLoading) {
    return (
      <ReviewerFilmstripLoadingSkeleton
        compact={isCompact && !focusLayout}
        expanded={focusLayout}
        focusLayout={focusLayout}
        frameCount={FRAME_COUNT}
      />
    );
  }

  if (!hasDuration) {
    return null;
  }

  return (
    <section
      className={cn(
        focusLayout ? "" : "rounded-xl border border-zinc-200/80 bg-white shadow-sm",
        !focusLayout && (isCompact ? "p-2" : "p-3")
      )}
    >
      <div className="relative">
        <div className={cn("flex overflow-x-auto", focusLayout ? "gap-1 py-0.5 lg:gap-1.5 lg:py-1" : "gap-1 pb-0.5")}>
          {Array.from({ length: FRAME_COUNT }, (_, index) => {
            const sec = frameTimeSec(index);
            const active = index === activeIndex;
            const thumb = frames[index];
            return (
              <button
                key={index}
                type="button"
                className={cn(
                  "relative shrink-0 overflow-hidden border bg-zinc-950 transition",
                  thumbSizeClass,
                  active
                    ? focusLayout
                      ? "border-violet-500 ring-2 ring-violet-300"
                      : "border-violet-500 ring-2 ring-violet-200"
                    : focusLayout
                      ? focusDark
                        ? "border-zinc-700 hover:border-zinc-500"
                        : "border-zinc-200 hover:border-zinc-300"
                      : "border-zinc-200 hover:border-zinc-300"
                )}
                onClick={() => onSeek(sec)}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <ReviewerRailShimmer rounded="rounded-none" className="absolute inset-0" />
                )}
              </button>
            );
          })}
          {focusLayout ? (
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg border bg-zinc-950",
                tabletCompact ? "h-8 w-8 rounded-md lg:h-16 lg:w-16 lg:rounded-lg" : "h-16 w-16",
                focusDark ? "border-zinc-700 text-zinc-500" : "border-zinc-200 text-zinc-400"
              )}
            >
              <span className="text-xs">...</span>
              <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
            </div>
          ) : (
            <div className="flex min-w-[24px] items-center justify-center text-zinc-300">
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-violet-600"
          style={{ left: `${Math.min(92, Math.max(4, playhead * 0.92))}%` }}
        />
      </div>
    </section>
  );
}
