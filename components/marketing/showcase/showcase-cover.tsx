"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import {
  resolveShowcaseCover,
  showcaseCoverVideoFallbackSrc
} from "@/lib/marketing/showcase-official";
import { recentWorkPosterFallbackPaths } from "@/lib/marketing/recent-work-media";
import { cn } from "@/lib/utils";

function ShowcaseVideoThumb({
  src,
  className,
  priority = false
}: {
  src: string;
  className?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const showFirstFrame = () => {
      video.pause();
      const duration = video.duration;
      video.currentTime =
        Number.isFinite(duration) && duration > 0 ? Math.min(0.25, duration / 4) : 0.1;
    };

    video.addEventListener("loadeddata", showFirstFrame);
    video.load();

    return () => {
      video.removeEventListener("loadeddata", showFirstFrame);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      playsInline
      preload={priority ? "auto" : "metadata"}
      className={cn("block h-full w-full object-cover", className)}
    />
  );
}

/** Poster image first; if missing, show first video frame via inline <video>. */
export function ShowcaseCover({
  work,
  className,
  priority = false,
  imageClassName
}: {
  work: Pick<MarketingShowcaseWorkDto, "thumbnail_url" | "video_url" | "title">;
  className?: string;
  priority?: boolean;
  imageClassName?: string;
}) {
  const cover = resolveShowcaseCover(work);
  const posterSources = useMemo(
    () => (cover.kind === "image" ? recentWorkPosterFallbackPaths(cover.src) : []),
    [cover]
  );
  const [posterIndex, setPosterIndex] = useState(0);
  const [useVideoThumb, setUseVideoThumb] = useState(false);
  const videoSrc = showcaseCoverVideoFallbackSrc(work.video_url);
  const activePoster = posterSources[posterIndex];

  useEffect(() => {
    setPosterIndex(0);
    setUseVideoThumb(false);
  }, [work.video_url, work.thumbnail_url, posterSources]);

  if (!useVideoThumb && cover.kind === "image" && activePoster) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={activePoster}
        src={activePoster}
        alt=""
        className={cn("block h-full w-full object-cover", imageClassName, className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={() => {
          if (posterIndex < posterSources.length - 1) {
            setPosterIndex((index) => index + 1);
            return;
          }
          setUseVideoThumb(true);
        }}
      />
    );
  }

  if (useVideoThumb || cover.kind === "video") {
    const src = cover.kind === "video" ? cover.src : videoSrc;
    if (src) {
      return <ShowcaseVideoThumb src={src} className={className} priority={priority} />;
    }
  }

  if (cover.kind === "placeholder") {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-zinc-800 px-3 text-center text-xs text-zinc-500",
          className
        )}
      >
        {cover.label}
      </div>
    );
  }

  return <div className={cn("h-full w-full bg-zinc-900", className)} aria-hidden />;
}
