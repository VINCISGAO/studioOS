"use client";

import { useMemo } from "react";
import { ReviewerTimelineLoadingSkeleton } from "@/components/studioos/reviewer-skeleton/reviewer-media-rail-skeleton";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { buildTimelineTicks, timelineSecToPercent, timelineTickAlign, timelineTickAlignClass } from "@/lib/studioos/review-timeline";
import type { ReviewerVideoStatus } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import { cn } from "@/lib/utils";

type TimelineMarker = {
  id: string;
  timestampSec: number;
  status: ReviewComment["status"];
  title: string;
  markerNumber: number;
};

const MARKER_COLORS = ["bg-orange-500", "bg-violet-500", "bg-emerald-500", "bg-sky-500", "bg-rose-500"];

export function ReviewerV1TimelineTrack({
  locale,
  label,
  compact = false,
  expandedLayout = false,
  focusLayout = false,
  focusDark = false,
  mobileCompact = false,
  videoStatus = "ready",
  comments,
  durationSec,
  currentSec,
  interactive = true,
  onSeek,
  onMarkerClick
}: {
  locale: Locale;
  label: string;
  compact?: boolean;
  expandedLayout?: boolean;
  focusLayout?: boolean;
  focusDark?: boolean;
  mobileCompact?: boolean;
  videoStatus?: ReviewerVideoStatus;
  comments: TimelineMarker[];
  durationSec: number;
  currentSec: number;
  interactive?: boolean;
  onSeek?: (sec: number) => void;
  onMarkerClick?: (comment: TimelineMarker) => void;
}) {
  const timelineTicks = useMemo(() => buildTimelineTicks(durationSec), [durationSec]);
  const playhead = timelineSecToPercent(currentSec, durationSec);
  const hasDuration = durationSec > 0;
  const isLoading = videoStatus === "loading" || (!hasDuration && videoStatus === "ready");
  const tickRowClass = expandedLayout ? "mb-1.5 h-5" : compact ? "mb-0.5 h-3" : "mb-1 h-4";
  const trackClass = expandedLayout ? "h-14" : compact ? "h-8" : "h-10";
  const headerClass = expandedLayout ? "mb-2.5 text-sm" : compact ? "mb-1 text-xs" : "mb-2 text-xs";

  function handleTrackClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!interactive || !hasDuration || !onSeek) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(durationSec, ratio * durationSec)));
  }

  if (isLoading) {
    return <ReviewerTimelineLoadingSkeleton label={label} compact={compact} expandedLayout={expandedLayout && focusLayout} />;
  }

  if (focusLayout && expandedLayout) {
    return (
      <section className="w-full">
        <div
          className={cn(
            "relative mb-2 flex items-center justify-end gap-2",
            mobileCompact && "max-lg:mb-1"
          )}
        >
          <h3
            className={cn(
              "absolute left-1/2 -translate-x-1/2 text-sm font-semibold",
              mobileCompact && "max-lg:text-xs",
              focusDark ? "text-zinc-100" : "text-zinc-900"
            )}
          >
            {label}
          </h3>
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums text-zinc-500",
              mobileCompact && "max-lg:text-[10px]"
            )}
          >
            {formatTimestamp(currentSec)}
            {hasDuration ? ` / ${formatTimestamp(durationSec)}` : ""}
          </span>
        </div>

        <div className={cn("relative mb-2 h-6", mobileCompact && "max-lg:mb-1 max-lg:h-5")}>
          {hasDuration
            ? comments.map((comment) => {
                const left = timelineSecToPercent(comment.timestampSec, durationSec);
                const color = MARKER_COLORS[(comment.markerNumber - 1) % MARKER_COLORS.length];
                return (
                  <button
                    key={comment.id}
                    type="button"
                    title={comment.title}
                    disabled={!interactive || !hasDuration}
                    className={cn(
                      "absolute top-0 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full text-[10px] font-semibold text-white shadow-sm",
                      color
                    )}
                    style={{ left: `${left}%` }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!interactive || !hasDuration) return;
                      if (onMarkerClick) {
                        onMarkerClick(comment);
                      } else {
                        onSeek?.(comment.timestampSec);
                      }
                    }}
                  >
                    {comment.markerNumber}
                  </button>
                );
              })
            : null}
        </div>

        <div className={cn("relative mb-1.5 h-4", mobileCompact && "max-lg:hidden")}>
          {hasDuration
            ? timelineTicks.map((tick, index) => {
                const left = timelineSecToPercent(tick, durationSec);
                const align = timelineTickAlign(index, timelineTicks.length);
                return (
                  <span
                    key={tick}
                    className={cn(
                      "absolute text-[10px] tabular-nums",
                      focusDark ? "text-zinc-500" : "text-zinc-400",
                      timelineTickAlignClass(align)
                    )}
                    style={{ left: `${left}%` }}
                  >
                    {formatTimestamp(tick)}
                  </span>
                );
              })
            : null}
        </div>

        <div
          className={cn(
            "relative h-10 -translate-y-[40px] rounded-lg",
            mobileCompact && "max-lg:h-8 max-lg:-translate-y-[25px]",
            focusDark ? "bg-zinc-800" : "bg-zinc-100",
            interactive && hasDuration ? "cursor-pointer" : ""
          )}
          onClick={handleTrackClick}
          role={interactive && hasDuration ? "slider" : undefined}
          aria-label={label}
        >
          {hasDuration
            ? timelineTicks.map((tick, index) => {
                const left = timelineSecToPercent(tick, durationSec);
                const align = timelineTickAlign(index, timelineTicks.length);
                return (
                  <span
                    key={`tick-${tick}`}
                    className={cn(
                      "pointer-events-none absolute inset-y-2 w-px",
                      focusDark ? "bg-zinc-600/80" : "bg-zinc-300/80",
                      timelineTickAlignClass(align)
                    )}
                    style={{ left: `${left}%` }}
                    aria-hidden
                  />
                );
              })
            : null}

          {hasDuration ? (
            <div
              className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-violet-600"
              style={{ left: `${playhead}%` }}
            >
              <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-violet-600" />
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        focusLayout ? (expandedLayout ? "px-1" : "") : "rounded-xl border border-zinc-200 bg-white shadow-sm",
        !focusLayout && (compact ? "p-2" : expandedLayout ? "p-3" : "p-3")
      )}
    >
      <div className={cn("flex items-center justify-between gap-3 font-medium text-zinc-600", headerClass)}>
        <span>{label}</span>
        <span className="tabular-nums text-zinc-500">
          {formatTimestamp(currentSec)}
          {hasDuration ? ` / ${formatTimestamp(durationSec)}` : ""}
        </span>
      </div>

      <div className={cn("relative overflow-visible", tickRowClass)}>
        {hasDuration
          ? timelineTicks.map((tick, index) => {
              const left = timelineSecToPercent(tick, durationSec);
              const align = timelineTickAlign(index, timelineTicks.length);
              return (
                <span
                  key={tick}
                  className={cn(
                    "absolute text-[10px] tabular-nums text-zinc-400",
                    timelineTickAlignClass(align)
                  )}
                  style={{ left: `${left}%` }}
                >
                  {formatTimestamp(tick)}
                </span>
              );
            })
          : null}
      </div>

      <div
        className={cn(
          "relative rounded-lg bg-zinc-100",
          trackClass,
          interactive && hasDuration ? "cursor-pointer" : ""
        )}
        onClick={handleTrackClick}
        role={interactive && hasDuration ? "slider" : undefined}
        aria-label={label}
      >
        {hasDuration
          ? timelineTicks.map((tick, index) => {
              const left = timelineSecToPercent(tick, durationSec);
              const align = timelineTickAlign(index, timelineTicks.length);
              return (
                <span
                  key={`tick-${tick}`}
                  className={cn(
                    "pointer-events-none absolute inset-y-2 w-px bg-zinc-300/80",
                    timelineTickAlignClass(align)
                  )}
                  style={{ left: `${left}%` }}
                  aria-hidden
                />
              );
            })
          : null}

        {comments.map((comment) => {
          const left = timelineSecToPercent(comment.timestampSec, durationSec);
          const color = MARKER_COLORS[(comment.markerNumber - 1) % MARKER_COLORS.length];
          return (
            <button
              key={comment.id}
              type="button"
              title={comment.title}
              disabled={!interactive || !hasDuration}
              className={`absolute top-1/2 z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-semibold text-white shadow ${color}`}
              style={{ left: `${left}%` }}
              onClick={(event) => {
                event.stopPropagation();
                if (!interactive || !hasDuration) return;
                if (onMarkerClick) {
                  onMarkerClick(comment);
                } else {
                  onSeek?.(comment.timestampSec);
                }
              }}
            >
              {comment.markerNumber}
            </button>
          );
        })}

        {hasDuration ? (
          <div
            className="pointer-events-none absolute inset-y-1 z-20 w-0.5 -translate-x-1/2 bg-violet-600"
            style={{ left: `${playhead}%` }}
          >
            <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-violet-600" />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function reviewCommentsToTimelineMarkers(comments: ReviewComment[]): TimelineMarker[] {
  return [...comments]
    .sort((a, b) => a.timestamp_sec - b.timestamp_sec || a.created_at.localeCompare(b.created_at))
    .map((comment, index) => ({
      id: comment.id,
      timestampSec: comment.timestamp_sec,
      status: comment.status,
      title: `${formatTimestamp(comment.timestamp_sec)} ${comment.body}`,
      markerNumber: index + 1
    }));
}
