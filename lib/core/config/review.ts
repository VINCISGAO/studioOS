/** Review module config — Vol 05 + Review.spec */
export const reviewConfig = {
  maxReviewRounds: 3,
  annotationDefaultColor: "#FF4D4F",
  signedUrlTtlSeconds: 300,
  nearTimestampSeconds: 0.35,
  allowedTools: ["comment", "circle", "rectangle", "arrow"] as const,
  timelineHeightPx: 56,
  playerSyncToleranceMs: 50
} as const;
