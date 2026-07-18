"use client";

const POOL_HOLDER_ID = "vincis-home-hero-video-pool";

type PooledHeroVideo = {
  element: HTMLVideoElement;
  src: string;
};

const pooledBySrc = new Map<string, PooledHeroVideo>();

function ensurePoolHolder(): HTMLElement {
  const existing = document.getElementById(POOL_HOLDER_ID);
  if (existing) return existing;

  const holder = document.createElement("div");
  holder.id = POOL_HOLDER_ID;
  holder.setAttribute("aria-hidden", "true");
  holder.hidden = true;
  document.body.appendChild(holder);
  return holder;
}

function createPooledVideo(src: string, preload: "auto" | "metadata" | "none"): HTMLVideoElement {
  const element = document.createElement("video");
  element.preload = preload;
  element.playsInline = true;
  element.muted = true;
  element.loop = true;
  element.autoplay = false;
  element.setAttribute("playsinline", "");
  element.setAttribute("webkit-playsinline", "");
  element.src = src;
  return element;
}

/** One pooled `<video>` per playback URL so hero + companion can coexist. */
export function acquireHomeHeroVideo(
  src: string,
  options?: { preload?: "auto" | "metadata" | "none" }
): HTMLVideoElement {
  const preload = options?.preload ?? "auto";
  const existing = pooledBySrc.get(src);
  if (existing) {
    if (preload === "auto" && existing.element.preload !== "auto") {
      existing.element.preload = "auto";
      if (existing.element.readyState === HTMLMediaElement.HAVE_NOTHING) {
        existing.element.load();
      }
    }
    return existing.element;
  }

  const element = createPooledVideo(src, preload);
  pooledBySrc.set(src, { element, src });
  return element;
}

export function isHomeHeroVideoBuffered(src: string): boolean {
  const pooled = pooledBySrc.get(src);
  if (!pooled) return false;
  return pooled.element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
}

export function releaseHomeHeroVideo(video: HTMLVideoElement): void {
  video.pause();
  ensurePoolHolder().appendChild(video);
}
