const THUMB_MAX_WIDTH = 160;

function waitForVideoEvent(video: HTMLVideoElement, event: "loadeddata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    function cleanup() {
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    }
    function onLoadedData() {
      cleanup();
      resolve();
    }
    function onSeeked() {
      cleanup();
      resolve();
    }
    function onError() {
      cleanup();
      reject(new Error("filmstrip-video-error"));
    }
    if (event === "loadeddata") {
      video.addEventListener("loadeddata", onLoadedData, { once: true });
    } else {
      video.addEventListener("seeked", onSeeked, { once: true });
    }
    video.addEventListener("error", onError, { once: true });
  });
}

function frameTimeSec(index: number, frameCount: number, durationSec: number) {
  if (frameCount <= 1) return 0;
  const ratio = index / frameCount;
  return Math.min(Math.max(0, ratio * durationSec), Math.max(0, durationSec - 0.04));
}

export async function captureReviewFilmstripFrames(
  videoUrl: string,
  durationSec: number,
  frameCount: number
): Promise<string[]> {
  if (!videoUrl || durationSec <= 0 || frameCount <= 0) {
    return [];
  }

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = videoUrl;

  try {
    await waitForVideoEvent(video, "loadeddata");
  } catch {
    video.removeAttribute("src");
    video.load();
    return [];
  }

  const sourceW = video.videoWidth || 320;
  const sourceH = video.videoHeight || 180;
  const scale = Math.min(1, THUMB_MAX_WIDTH / sourceW);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceW * scale));
  canvas.height = Math.max(1, Math.round(sourceH * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    video.removeAttribute("src");
    video.load();
    return [];
  }

  const frames: string[] = [];
  for (let index = 0; index < frameCount; index += 1) {
    video.currentTime = frameTimeSec(index, frameCount, durationSec);
    try {
      await waitForVideoEvent(video, "seeked");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.72));
    } catch {
      frames.push("");
    }
  }

  video.removeAttribute("src");
  video.load();
  return frames;
}

export { frameTimeSec };
