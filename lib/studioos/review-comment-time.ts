export function normalizeReviewCommentTimestampSec(raw: unknown): number {
  if (raw != null && typeof raw === "object" && "toNumber" in raw) {
    const toNumber = (raw as { toNumber?: () => number }).toNumber;
    if (typeof toNumber === "function") {
      const converted = toNumber.call(raw);
      if (typeof converted === "number" && Number.isFinite(converted) && converted >= 0) {
        return converted;
      }
    }
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

export function readVideoCommentTimestampSec(
  video: HTMLVideoElement | null | undefined,
  fallbackSec = 0
): number {
  const fromVideo = video?.currentTime;
  if (typeof fromVideo === "number" && Number.isFinite(fromVideo) && fromVideo >= 0) {
    return fromVideo;
  }
  return normalizeReviewCommentTimestampSec(fallbackSec);
}
