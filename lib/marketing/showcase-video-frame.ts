/** Middle-frame seek time for homepage showcase posters. */
export function showcaseMiddleFrameTime(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0.1;
  return Math.max(0.1, duration / 2);
}
