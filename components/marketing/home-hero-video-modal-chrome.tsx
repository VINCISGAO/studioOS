"use client";

import { useId, type CSSProperties } from "react";
import { Minimize2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type HomeHeroVideoModalChromeProps = {
  bar: "top" | "bottom";
  showControls: boolean;
  muted: boolean;
  duration: number;
  displayTime: number;
  progress: number;
  zh: boolean;
  onActivateControls: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onScrubStart: (time: number) => void;
  onScrubMove: (time: number) => void;
  onScrubEnd: (time: number) => void;
  onScrubCancel: () => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const iconBtnClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

export function HomeHeroVideoModalChrome({
  bar,
  showControls,
  muted,
  duration,
  displayTime,
  progress,
  zh,
  onActivateControls,
  onToggleMute,
  onToggleFullscreen,
  onScrubStart,
  onScrubMove,
  onScrubEnd,
  onScrubCancel
}: HomeHeroVideoModalChromeProps) {
  const seekId = useId().replace(/:/g, "");

  if (bar === "top") {
    return (
      <div
        className={cn(
          "home-hero-video-modal-topbar flex shrink-0 items-center justify-between px-4 sm:px-6",
          showControls ? "opacity-100" : "opacity-0"
        )}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={iconBtnClassName}
          aria-pressed={muted}
          aria-label={muted ? (zh ? "开启视频声音" : "Unmute video") : zh ? "关闭视频声音" : "Mute video"}
          onClick={onToggleMute}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button
          type="button"
          className={iconBtnClassName}
          aria-label={zh ? "退出全屏" : "Exit fullscreen"}
          onClick={onToggleFullscreen}
        >
          <Minimize2 className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "home-hero-video-modal-bottombar shrink-0 px-4 pb-5 pt-2 sm:px-6 sm:pb-6",
        showControls ? "opacity-100" : "opacity-0"
      )}
      onPointerDown={(event) => {
        event.stopPropagation();
        onActivateControls();
      }}
    >
      <span className="mb-2 block text-xs font-medium tabular-nums text-zinc-300 sm:text-sm">
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
  );
}
