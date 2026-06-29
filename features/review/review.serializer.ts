import type { ReviewComment, ReviewAnnotation } from "@prisma/client";
import { buildVersionPlayback } from "@/features/video/playback-token.service";

export function serializeReviewComment(
  comment: ReviewComment & { annotations?: ReviewAnnotation[] }
) {
  const annotation = comment.annotations?.[0];
  return {
    id: comment.id,
    campaignId: comment.campaignId,
    versionId: comment.versionId,
    userId: comment.userId,
    timeSeconds: Number(comment.timeSeconds),
    comment: comment.comment,
    resolved: comment.resolved,
    annotation: annotation
      ? {
          type: annotation.type,
          x: Number(annotation.x),
          y: Number(annotation.y),
          width: Number(annotation.width),
          height: Number(annotation.height),
          color: annotation.color
        }
      : null,
    createdAt: comment.createdAt.toISOString()
  };
}

export function serializeReviewVersion(
  version: {
    id: string;
    campaignId: string;
    versionNumber: number;
    videoUrl: string | null;
    hlsUrl: string | null;
    thumbnailUrl: string | null;
    duration: unknown;
    reviewStatus: string;
    status: string;
    createdAt: Date;
  },
  viewerUserId?: string
) {
  const playback = viewerUserId
    ? buildVersionPlayback(version, viewerUserId)
    : { mp4: null, hls: version.hlsUrl, thumbnail: version.thumbnailUrl };

  return {
    id: version.id,
    campaignId: version.campaignId,
    versionNumber: version.versionNumber,
    playback,
    duration: version.duration != null ? Number(version.duration) : null,
    reviewStatus: version.reviewStatus,
    status: version.status,
    createdAt: version.createdAt.toISOString()
  };
}
