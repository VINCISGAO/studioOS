"use client";

import { useEffect, useRef } from "react";

type Props = {
  hlsUrl: string | null;
  className?: string;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata: () => void;
  onDurationChange: () => void;
  onLoadedData: () => void;
  onPlay: () => void;
  onPause: () => void;
  onClick: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
};

function canPlayNativeHls(): boolean {
  if (typeof document === "undefined") return false;
  const video = document.createElement("video");
  return video.canPlayType("application/vnd.apple.mpegurl") !== "";
}

export function ReviewVideoSource({
  hlsUrl,
  className,
  onTimeUpdate,
  onLoadedMetadata,
  onDurationChange,
  onLoadedData,
  onPlay,
  onPause,
  onClick,
  videoRef: externalRef
}: Props) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalRef ?? internalRef;
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!videoRef.current || !hlsUrl) return;

    const mediaEl: HTMLVideoElement = videoRef.current;
    const sourceUrl = hlsUrl;
    let cancelled = false;

    async function attachSource() {
      hlsRef.current?.destroy();
      hlsRef.current = null;

      if (canPlayNativeHls()) {
        mediaEl.src = sourceUrl;
        mediaEl.load();
        return;
      }

      try {
        const mod = await import("hls.js");
        const Hls = mod.default;
        if (Hls.isSupported() && !cancelled) {
          const hls = new Hls({ enableWorker: true });
          hlsRef.current = hls;
          hls.loadSource(sourceUrl);
          hls.attachMedia(mediaEl);
          return;
        }
      } catch {
        // ADR-002: no MP4 fallback
      }
    }

    void attachSource();

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [hlsUrl, videoRef]);

  return (
    <video
      ref={videoRef}
      className={className}
      playsInline
      preload="metadata"
      onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
      onLoadedMetadata={onLoadedMetadata}
      onDurationChange={onDurationChange}
      onLoadedData={onLoadedData}
      onPlay={onPlay}
      onPause={onPause}
      onClick={onClick}
    />
  );
}
