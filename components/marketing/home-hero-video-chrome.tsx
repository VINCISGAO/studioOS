"use client";

import { useId, type CSSProperties, type RefObject } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type HomeHeroVideoChromeProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  shellClassName?: string;
  showControls: boolean;
  muted: boolean;
  duration: number;
  displayTime: number;
  progress: number;
  zh: boolean;
  fullscreen?: boolean;
  onActivateControls: () => void;
  onDeactivateControls?: () => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onScrubStart: (time: number) => void;
  onScrubMove: (time: number) => void;
  onScrubEnd: (time: number) => void;
  onScrubCancel: () => void;
};

export function HomeHeroVideoChrome({
  videoRef,
  shellClassName,
  showControls,
  muted,
  duration,
  displayTime,
  progress,
  zh,
  fullscreen = false,
  onActivateControls,
  onDeactivateControls,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  onScrubStart,
  onScrubMove,
  onScrubEnd,
  onScrubCancel
}: HomeHeroVideoChromeProps) {
  const seekId = useId().replace(/:/g, "");

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const total = Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "home-hero-video-shell group relative cursor-pointer touch-manipulation",
        shellClassName,
        showControls && "home-hero-video-controls-visible"
      )}
      aria-label={videoRef.current?.paused ? (zh ? "播放视频" : "Play video") : zh ? "暂停视频" : "Pause video"}
      onPointerEnter={onActivateControls}
      onPointerLeave={onDeactivateControls}
      onFocusCapture={onActivateControls}
      onBlurCapture={(event) => {
        if (!onDeactivateControls) return;
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        onDeactivateControls();
      }}
      onClick={onTogglePlay}
    >
      <div className="home-hero-video-controls absolute inset-0 z-20">
        <button
          type="button"
          className="home-hero-video-mute-btn absolute left-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-4 sm:top-4 sm:h-10 sm:w-10"
          aria-pressed={muted}
          aria-label={muted ? (zh ? "开启视频声音" : "Unmute video") : zh ? "关闭视频声音" : "Mute video"}
          onClick={(event) => {
            event.stopPropagation();
            onActivateControls();
            onToggleMute();
          }}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <button
          type="button"
          className="home-hero-video-fullscreen-btn absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
          aria-label={fullscreen ? (zh ? "退出全屏" : "Exit fullscreen") : zh ? "全屏" : "Fullscreen"}
          onClick={(event) => {
            event.stopPropagation();
            onActivateControls();
            onToggleFullscreen();
          }}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        <div
          className="home-hero-video-bottom absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-6 sm:px-4 sm:pb-3.5"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            event.stopPropagation();
            onActivateControls();
          }}
        >
          <span className="mb-1 block text-[11px] font-medium tabular-nums text-white sm:text-xs">
            {formatTime(displayTime)} / {formatTime(duration)}
          </span>
          <label className="sr-only" htmlFor={seekId}>
            {zh ? "拖动视频进度" : "Seek video progress"}
          </label>
          <input
            id={seekId}
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={displayTime}
            disabled={duration <= 0}
            aria-label={zh ? "拖动视频进度" : "Seek video progress"}
            aria-valuemin={0}
            aria-valuemax={duration || 0}
            aria-valuenow={displayTime}
            className="home-hero-video-range h-1 w-full cursor-pointer appearance-none rounded-sm"
            style={{ "--hero-video-progress": `${progress}%` } as CSSProperties}
            onPointerDown={(event) => {
              event.stopPropagation();
              onActivateControls();
              const value = Number(event.currentTarget.value);
              onScrubStart(value);
            }}
            onInput={(event) => {
              const value = Number(event.currentTarget.value);
              onScrubMove(value);
            }}
            onPointerUp={(event) => {
              const value = Number(event.currentTarget.value);
              onScrubEnd(value);
            }}
            onPointerCancel={onScrubCancel}
          />
        </div>
      </div>
    </div>
  );
}
