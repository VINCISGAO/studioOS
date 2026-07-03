import { formatTimestamp } from "@/lib/studioos/review-utils";
import { ReviewerV1TimelineTrack } from "@/components/studioos/reviewer-v1/reviewer-v1-timeline-track";
import type { Locale } from "@/lib/i18n";
import type { ReviewerSkeletonMock } from "@/components/studioos/reviewer-skeleton/reviewer-skeleton-mock";

export function ReviewerSkeletonTimeline({
  locale,
  mock
}: {
  locale: Locale;
  mock: ReviewerSkeletonMock;
}) {
  return (
    <ReviewerV1TimelineTrack
      locale={locale}
      label={locale === "zh" ? "时间线" : "Timeline"}
      comments={mock.comments.map((comment) => ({
        id: comment.id,
        timestampSec: comment.timestampSec,
        status: comment.status,
        title: `${formatTimestamp(comment.timestampSec)} ${comment.body}`
      }))}
      durationSec={mock.durationSec}
      currentSec={mock.currentSec}
      interactive={false}
    />
  );
}
