"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function resolvePosterVideoSrc(src: string): string {
  return src;
}

/** Lightweight fallback poster — first frame from CDN video (metadata preload only). */
export function ShowcaseVideoPoster({
  src,
  className,
  priority = false
}: {
  src: string;
  className?: string;
  priority?: boolean;
}) {
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const videoSrc = resolvePosterVideoSrc(src);

  useEffect(() => {
    setFrameSrc(null);
    setFailed(false);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    if (!videoSrc.startsWith("/")) {
      video.crossOrigin = "anonymous";
    }
    video.src = videoSrc;

    let disposed = false;
    let captured = false;

    const revokeObjectUrl = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };

    const captureFrame = () => {
      if (disposed || captured) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width <= 0 || height <= 0) return;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        setFailed(true);
        return;
      }

      context.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (disposed) return;
          if (!blob) {
            setFailed(true);
            return;
          }
          captured = true;
          revokeObjectUrl();
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setFrameSrc(url);
        },
        "image/jpeg",
        0.82
      );
    };

    const seekToFirstFrame = () => {
      if (disposed || captured) return;
      const duration = video.duration;
      const target = Number.isFinite(duration) && duration > 0 ? Math.min(0.5, duration / 4) : 0.1;
      video.pause();
      video.currentTime = target;
    };

    const onSeeked = () => {
      window.requestAnimationFrame(() => captureFrame());
    };

    video.addEventListener("loadeddata", seekToFirstFrame);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", () => {
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      video.pause();
      video.removeAttribute("src");
      video.load();
      revokeObjectUrl();
    };
  }, [videoSrc]);

  if (frameSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={frameSrc}
        alt=""
        className={cn("h-full w-full object-cover", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
    );
  }

  return (
    <div
      className={cn(
        "h-full w-full bg-zinc-900",
        !failed && "animate-pulse",
        failed && "bg-zinc-800",
        className
      )}
      aria-hidden
    />
  );
}
