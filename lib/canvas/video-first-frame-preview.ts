/** Seek target for painting a visible frame (some encodes are black at t=0). */
export const VIDEO_FIRST_FRAME_SEEK_SEC = 0.05;

export function resolveVideoFirstFrameSeekSec(durationSec: number) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0.001;
  if (durationSec <= VIDEO_FIRST_FRAME_SEEK_SEC + 0.02) return 0.001;
  return VIDEO_FIRST_FRAME_SEEK_SEC;
}

/** Prime `<video>` to show the first visible frame while paused. */
export function attachVideoFirstFramePreview(
  video: HTMLVideoElement,
  onFrame?: () => void
) {
  let cancelled = false;

  function notifyFrame() {
    if (cancelled) return;
    video.pause();
    onFrame?.();
  }

  function prime() {
    if (cancelled) return;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    const target = resolveVideoFirstFrameSeekSec(video.duration);
    if (Math.abs(video.currentTime - target) > 0.02) {
      video.currentTime = target;
      return;
    }
    notifyFrame();
  }

  function onSeeked() {
    notifyFrame();
  }

  video.addEventListener("loadeddata", prime);
  video.addEventListener("seeked", onSeeked);
  prime();

  return () => {
    cancelled = true;
    video.removeEventListener("loadeddata", prime);
    video.removeEventListener("seeked", onSeeked);
  };
}
