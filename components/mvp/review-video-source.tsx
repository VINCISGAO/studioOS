"use client";

import { useEffect, useRef } from "react";

type Props = {
  hlsUrl: string | null;
  fileUrl?: string | null;
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

function isHlsPlaylist(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}

export function ReviewVideoSource({
  hlsUrl,
  fileUrl,
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

  const mp4Url = fileUrl?.trim() || null;
  const streamUrl = hlsUrl?.trim() || null;
  const directPlaybackUrl = !streamUrl || !isHlsPlaylist(streamUrl) ? streamUrl ?? mp4Url : null;
  const hlsPlaybackUrl = streamUrl && isHlsPlaylist(streamUrl) ? streamUrl : null;

  useEffect(() => {
    if (!videoRef.current) return;

    const mediaEl: HTMLVideoElement = videoRef.current;
    let cancelled = false;

    async function attachSource() {
      hlsRef.current?.destroy();
      hlsRef.current = null;

      if (!directPlaybackUrl && !hlsPlaybackUrl) {
        mediaEl.removeAttribute("src");
        mediaEl.load();
        return;
      }

      if (directPlaybackUrl) {
        mediaEl.src = directPlaybackUrl;
        mediaEl.load();
        return;
      }

      if (!hlsPlaybackUrl) return;

      if (canPlayNativeHls()) {
        mediaEl.src = hlsPlaybackUrl;
        mediaEl.load();
        return;
      }

      try {
        const mod = await import("hls.js");
        const Hls = mod.default;
        if (Hls.isSupported() && !cancelled) {
          const hls = new Hls({ enableWorker: true });
          hlsRef.current = hls;
          hls.loadSource(hlsPlaybackUrl);
          hls.attachMedia(mediaEl);
        }
      } catch {
        mediaEl.src = hlsPlaybackUrl;
        mediaEl.load();
      }
    }

    void attachSource();

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [directPlaybackUrl, hlsPlaybackUrl, videoRef]);

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
