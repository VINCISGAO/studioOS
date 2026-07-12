"use client";

const POOL_HOLDER_ID = "vincis-home-hero-video-pool";

type PooledHeroVideo = {
  element: HTMLVideoElement;
  src: string;
};

let pooled: PooledHeroVideo | null = null;

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

function createPooledVideo(): HTMLVideoElement {
  const element = document.createElement("video");
  element.preload = "auto";
  element.playsInline = true;
  element.muted = true;
  element.loop = true;
  element.autoplay = true;
  element.setAttribute("playsinline", "");
  element.setAttribute("webkit-playsinline", "");
  return element;
}

export function acquireHomeHeroVideo(src: string): HTMLVideoElement {
  if (!pooled) {
    pooled = { element: createPooledVideo(), src: "" };
  }

  const { element } = pooled;
  if (pooled.src !== src) {
    pooled.src = src;
    element.src = src;
  }

  return element;
}

export function isHomeHeroVideoBuffered(src: string): boolean {
  if (!pooled || pooled.src !== src) return false;
  return pooled.element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
}

export function releaseHomeHeroVideo(video: HTMLVideoElement): void {
  video.pause();
  ensurePoolHolder().appendChild(video);
}
