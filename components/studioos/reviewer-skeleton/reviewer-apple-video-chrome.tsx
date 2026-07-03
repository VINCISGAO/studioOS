"use client";

import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ReviewerAppleVideoChrome({
  locale,
  compact,
  focusLayout = false,
  canPlay,
  isPlaying,
  isFullscreen,
  controlsVisible,
  showCenterPlay = true,
  currentSec,
  durationSec,
  volume,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleFullscreen,
  onRevealControls
}: {
  locale: Locale;
  compact?: boolean;
  focusLayout?: boolean;
  canPlay: boolean;
  isPlaying: boolean;
  isFullscreen: boolean;
  controlsVisible: boolean;
  showCenterPlay?: boolean;
  currentSec: number;
  durationSec: number;
  volume: number;
  onPlayPause: () => void;
  onSeek: (sec: number) => void;
  onVolumeChange: (value: number) => void;
  onToggleFullscreen: () => void;
  onRevealControls: () => void;
}) {
  const progress = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;
  const muted = volume <= 0.001;
  const fullscreenLabel =
    locale === "zh" ? (isFullscreen ? "退出全屏" : "全屏") : isFullscreen ? "Exit fullscreen" : "Fullscreen";

  function seekFromClientX(clientX: number, target: HTMLDivElement) {
    if (!durationSec) return;
    const rect = target.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(durationSec, ratio * durationSec)));
  }

  return (
    <>
      {!isPlaying && canPlay && showCenterPlay ? (
        <button
          type="button"
          aria-label={locale === "zh" ? "播放" : "Play"}
          className="absolute inset-0 z-20 flex items-center justify-center"
          onClick={(event) => {
            event.stopPropagation();
            onPlayPause();
          }}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-md transition hover:scale-105 hover:bg-white/20">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
        </button>
      ) : null}

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-opacity duration-300",
          focusLayout && "max-lg:bg-none max-lg:from-transparent max-lg:via-transparent",
          compact ? "pt-10" : focusLayout ? "pt-12" : "pt-14",
          controlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
        )}
        onMouseMove={onRevealControls}
      >
        <div className={cn("pointer-events-auto px-4 pb-3 pt-2", focusLayout && "max-lg:pb-9")}>
          <div
            className="group mb-3 h-1 cursor-pointer rounded-full bg-white/20"
            onClick={(event) => seekFromClientX(event.clientX, event.currentTarget)}
          >
            <div
              className="relative h-full rounded-full bg-white transition-all group-hover:h-1.5"
              style={{ width: `${progress}%` }}
            >
              <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-white opacity-0 shadow transition group-hover:opacity-100" />
            </div>
          </div>

          <div className="flex items-center gap-3 text-white">
            <button
              type="button"
              disabled={!canPlay}
              aria-label={isPlaying ? (locale === "zh" ? "暂停" : "Pause") : locale === "zh" ? "播放" : "Play"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10 disabled:opacity-40"
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            <span className="min-w-[5.5rem] text-xs font-medium tabular-nums text-white/90">
              {formatTimestamp(currentSec)} / {formatTimestamp(durationSec)}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                aria-label={muted ? (locale === "zh" ? "取消静音" : "Unmute") : locale === "zh" ? "静音" : "Mute"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
                onClick={() => onVolumeChange(muted ? 0.8 : 0)}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                aria-label={locale === "zh" ? "音量" : "Volume"}
                className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/25 accent-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                onChange={(event) => onVolumeChange(Number(event.target.value))}
              />
              {focusLayout ? (
                <span className="rounded border border-white/20 px-2 py-0.5 text-[10px] font-medium text-white/80">
                  1080P
                </span>
              ) : null}
              <button
                type="button"
                aria-label={fullscreenLabel}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
