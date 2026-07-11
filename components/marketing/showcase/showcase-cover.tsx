"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import {
  resolveShowcaseCover,
  showcaseCoverVideoFallbackSrc
} from "@/lib/marketing/showcase-official";
import {
  isRecentWorkImagePath,
  recentWorkCdnUrl,
  recentWorkPosterFallbackPaths
} from "@/lib/marketing/recent-work-media";
import { cn } from "@/lib/utils";

function useInView(priority: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(priority);

  useEffect(() => {
    if (priority || inView) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "280px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [priority, inView]);

  return { ref, inView };
}

function CoverPlaceholder({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-zinc-800 px-3 text-center text-xs text-zinc-500",
          className
        )}
      >
        {label}
      </div>
    );
  }

  return <div className={cn("h-full w-full bg-zinc-900", className)} aria-hidden />;
}

function ShowcaseVideoThumb({
  src,
  poster,
  className,
  enabled
}: {
  src: string;
  poster?: string | null;
  className?: string;
  enabled: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!enabled) return;
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
  }, [src, enabled]);

  if (!enabled) {
    return <CoverPlaceholder className={cn("absolute inset-0", className)} />;
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster ?? undefined}
      muted
      playsInline
      preload="none"
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
    />
  );
}

/** Poster image first; video frame fallback only when near viewport (never eager MP4 on grid). */
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
  const posterSources = useMemo(() => {
    if (cover.kind !== "image") return [];
    const paths = recentWorkPosterFallbackPaths(cover.src);
    if (isRecentWorkImagePath(cover.src)) {
      paths.push(recentWorkCdnUrl(cover.src));
    }
    return [...new Set(paths)];
  }, [cover]);
  const [posterIndex, setPosterIndex] = useState(0);
  const [useVideoThumb, setUseVideoThumb] = useState(false);
  const videoSrc = showcaseCoverVideoFallbackSrc(work.video_url);
  const activePoster = posterSources[posterIndex];
  const { ref, inView } = useInView(priority);

  useEffect(() => {
    setPosterIndex(0);
    setUseVideoThumb(false);
  }, [work.video_url, work.thumbnail_url, posterSources]);

  const wantsVideoThumb = useVideoThumb || cover.kind === "video";
  const canLoadVideoThumb = inView && wantsVideoThumb;

  let body: ReactNode;

  if (!useVideoThumb && cover.kind === "image" && activePoster) {
    body = (
      <>
        <CoverPlaceholder className="absolute inset-0" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={activePoster}
          src={activePoster}
          alt=""
          className={cn(
            "absolute inset-0 z-[1] h-full w-full object-cover",
            imageClassName
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onError={(event) => {
            event.currentTarget.removeAttribute("src");
            if (posterIndex < posterSources.length - 1) {
              setPosterIndex((index) => index + 1);
              return;
            }
            setUseVideoThumb(true);
          }}
        />
      </>
    );
  } else if (wantsVideoThumb) {
    const src = cover.kind === "video" ? cover.src : videoSrc;
    const poster =
      cover.kind === "image" && posterSources[0] ? posterSources[0] : work.thumbnail_url?.trim() || null;
    body = src ? (
      <ShowcaseVideoThumb
        src={src}
        poster={poster}
        enabled={canLoadVideoThumb}
        className={imageClassName}
      />
    ) : (
      <CoverPlaceholder className="absolute inset-0" label={work.title} />
    );
  } else if (cover.kind === "placeholder") {
    body = <CoverPlaceholder className="absolute inset-0" label={cover.label} />;
  } else {
    body = <CoverPlaceholder className="absolute inset-0" />;
  }

  return (
    <div ref={ref} className={cn("relative h-full w-full overflow-hidden", className)}>
      {body}
    </div>
  );
}
