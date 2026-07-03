"use client";

import { getReviewerV1Copy } from "@/components/studioos/reviewer-v1/reviewer-v1-copy";
import {
  ReviewerV1TimelineTrack,
  reviewCommentsToTimelineMarkers
} from "@/components/studioos/reviewer-v1/reviewer-v1-timeline-track";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";

export function ReviewerV1Timeline({
  locale,
  comments,
  durationSec,
  currentSec,
  onSeek
}: {
  locale: Locale;
  comments: ReviewComment[];
  durationSec: number;
  currentSec: number;
  onSeek: (sec: number) => void;
}) {
  const t = getReviewerV1Copy(locale);
  return (
    <ReviewerV1TimelineTrack
      locale={locale}
      label={t.timeline.label}
      comments={reviewCommentsToTimelineMarkers(comments)}
      durationSec={durationSec}
      currentSec={currentSec}
      onSeek={onSeek}
    />
  );
}
