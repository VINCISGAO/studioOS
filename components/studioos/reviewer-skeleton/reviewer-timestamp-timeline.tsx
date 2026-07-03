"use client";

import {
  ReviewerV1TimelineTrack,
  reviewCommentsToTimelineMarkers
} from "@/components/studioos/reviewer-v1/reviewer-v1-timeline-track";
import type { ReviewerVideoStatus } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";

export function ReviewerTimestampTimeline({
  locale,
  compact = false,
  focusLayout = false,
  focusDark = false,
  portalLayout = false,
  mobileCompact = false,
  videoStatus = "ready",
  comments,
  durationSec,
  currentSec,
  onSeek,
  onSelectComment
}: {
  locale: Locale;
  compact?: boolean;
  focusLayout?: boolean;
  focusDark?: boolean;
  portalLayout?: boolean;
  mobileCompact?: boolean;
  videoStatus?: ReviewerVideoStatus;
  comments: ReviewComment[];
  durationSec: number;
  currentSec: number;
  onSeek: (sec: number) => void;
  onSelectComment: (comment: ReviewComment) => void;
}) {
  const markers = reviewCommentsToTimelineMarkers(comments);

  return (
    <ReviewerV1TimelineTrack
      locale={locale}
      compact={false}
      expandedLayout={portalLayout || focusLayout}
      focusLayout={focusLayout}
      focusDark={focusDark}
      mobileCompact={mobileCompact}
      videoStatus={videoStatus}
      label={portalLayout || focusLayout ? (locale === "zh" ? "时间轴批注" : "Timeline notes") : locale === "zh" ? "时间线" : "Timeline"}
      comments={markers}
      durationSec={durationSec}
      currentSec={currentSec}
      onSeek={onSeek}
      onMarkerClick={(marker) => {
        const comment = comments.find((item) => item.id === marker.id);
        if (comment) onSelectComment(comment);
      }}
    />
  );
}
