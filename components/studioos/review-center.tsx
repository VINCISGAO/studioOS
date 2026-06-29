"use client";

import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { VideoReviewPlayer } from "@/components/studioos/video-review-player";

type ReviewCenterProps = {
  locale: Locale;
  orderId: string;
  videoUrl?: string | null;
  initialComments: ReviewComment[];
  versions?: StoredDeliverable[];
};

/** @deprecated Use VideoReviewPlayer directly */
export function ReviewCenter({
  locale,
  orderId,
  videoUrl,
  initialComments,
  versions = []
}: ReviewCenterProps) {
  const resolvedVersions =
    versions.length > 0
      ? versions
      : videoUrl
        ? [
            {
              id: "legacy_v1",
              order_id: orderId,
              file_url: videoUrl,
              thumbnail_url: videoUrl,
              notes: "",
              version: 1,
              created_at: new Date().toISOString()
            }
          ]
        : [];

  return (
    <VideoReviewPlayer
      locale={locale}
      orderId={orderId}
      role="brand"
      versions={resolvedVersions}
      initialComments={initialComments}
    />
  );
}
