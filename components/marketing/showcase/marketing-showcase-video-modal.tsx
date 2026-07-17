"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { resolveVideoEmbed } from "@/lib/media-url";
import { showcaseVideoSrc } from "@/lib/marketing/showcase-official";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import type { MarketingLocale } from "@/lib/i18n";
import { isChineseMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";
import { cn } from "@/lib/utils";

export function MarketingShowcaseVideoModal({
  work,
  locale,
  onClose
}: {
  work: MarketingShowcaseWorkDto;
  locale: MarketingLocale;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const embed = resolveVideoEmbed(work.video_url);
  const directVideoSrc = showcaseVideoSrc(work);
  const isZh = isChineseMarketingLocale(locale);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }

  async function enterFullscreen() {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      await video.requestFullscreen().catch(() => undefined);
      return;
    }
    const webkitVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    webkitVideo.webkitEnterFullscreen?.();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 sm:p-8" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={isZh ? "关闭" : "Close"}
        onClick={onClose}
      />
      <div className="relative z-[1] w-full max-w-5xl overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white sm:text-base">{work.title}</p>
            <p className="truncate text-xs text-zinc-400">
              {[work.category, work.platform].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label={isZh ? "关闭" : "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative aspect-video w-full bg-black">
          {embed.kind === "video" && directVideoSrc && !videoFailed ? (
            <video
              ref={videoRef}
              src={directVideoSrc}
              className={cn(
                "h-full w-full object-contain transition-opacity duration-200",
                videoReady ? "opacity-100" : "opacity-0"
              )}
              playsInline
              autoPlay
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onPlaying={() => setVideoReady(true)}
              onError={() => setVideoFailed(true)}
              onClick={togglePlay}
            />
          ) : embed.kind === "iframe" ? (
            <iframe
              src={embed.src}
              title={work.title}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">{work.title}</div>
          )}

          {videoFailed ? (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-zinc-400">
              {isZh ? "视频暂时无法加载，请稍后再试。" : "This video cannot be loaded right now. Please try again later."}
            </div>
          ) : null}

          {embed.kind === "video" && directVideoSrc && !videoFailed ? (
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
                aria-label={isPlaying ? (isZh ? "暂停" : "Pause") : isZh ? "播放" : "Play"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
              </button>
              <button
                type="button"
                onClick={() => void enterFullscreen()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
                aria-label={isZh ? "全屏放大" : "Fullscreen"}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        {work.description ? (
          <div className="border-t border-white/10 px-4 py-3 text-sm leading-6 text-zinc-300 sm:px-5">{work.description}</div>
        ) : null}
      </div>
    </div>
  );
}
