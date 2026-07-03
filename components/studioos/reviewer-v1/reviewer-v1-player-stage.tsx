"use client";

import { AlertCircle, Pause, Play, Volume2, Maximize } from "lucide-react";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { getReviewerV1Copy } from "@/components/studioos/reviewer-v1/reviewer-v1-copy";
import type { ReviewerVideoStatus } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import type { Locale } from "@/lib/i18n";
import type { ReviewerAnnotationShape, ReviewerTool } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import { ReviewerV1AnnotationLayer } from "@/components/studioos/reviewer-v1/reviewer-v1-annotation-layer";

function videoBannerMessage(
  locale: Locale,
  status: ReviewerVideoStatus,
  role: "brand" | "creator"
) {
  const t = getReviewerV1Copy(locale);
  if (status === "missing") return t.player.videoMissing;
  if (status === "loading") return t.player.loadingVideo;
  if (status === "error") {
    return role === "creator" ? t.player.videoLoadFailedCreator : t.player.videoLoadFailed;
  }
  return null;
}

export function ReviewerV1PlayerStage({
  locale,
  role,
  playbackVersion,
  videoUrl,
  videoRef,
  stageRef,
  videoStatus,
  isPlaying,
  currentSec,
  durationSec,
  playbackRate,
  volume,
  canDraw,
  activeTool,
  penColor,
  penSize,
  annotations,
  pendingAnnotations,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onToggleFullscreen,
  onTimeUpdate,
  onLoadedMetadata,
  onLoadedData,
  onError,
  onPlay,
  onPause,
  onEnded,
  onCreateAnnotation
}: {
  locale: Locale;
  role: "brand" | "creator";
  playbackVersion: number;
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  videoStatus: ReviewerVideoStatus;
  isPlaying: boolean;
  currentSec: number;
  durationSec: number;
  playbackRate: number;
  volume: number;
  canDraw: boolean;
  activeTool: ReviewerTool;
  penColor: string;
  penSize: number;
  annotations: ReviewerAnnotationShape[];
  pendingAnnotations: ReviewerAnnotationShape[];
  onPlayPause: () => void;
  onSeek: (sec: number) => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onLoadedData: () => void;
  onError: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onCreateAnnotation: (annotation: ReviewerAnnotationShape, suggestedBody?: string) => void;
}) {
  const t = getReviewerV1Copy(locale);
  const progress = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;
  const banner = videoBannerMessage(locale, videoUrl ? videoStatus : "missing", role);
  const canPlay = Boolean(videoUrl) && videoStatus !== "error";

  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-950 p-3">
      {banner && videoStatus !== "ready" ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{banner}</span>
        </div>
      ) : null}
      <div ref={stageRef} className="relative aspect-video overflow-hidden rounded-lg bg-black">
        {videoUrl && videoStatus !== "error" ? (
          <video
            ref={videoRef}
            key={`${playbackVersion}:${videoUrl}`}
            src={videoUrl}
            className="h-full w-full object-contain"
            playsInline
            preload="metadata"
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onLoadedData={onLoadedData}
            onError={onError}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
            onClick={onPlayPause}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-400">
            {banner ?? (locale === "zh" ? "暂无视频" : "No video")}
          </div>
        )}
        <ReviewerV1AnnotationLayer
          locale={locale}
          annotations={annotations}
          pendingAnnotations={pendingAnnotations}
          activeTool={activeTool}
          canDraw={canDraw}
          penColor={penColor}
          penSize={penSize}
          currentSec={currentSec}
          onCreateAnnotation={onCreateAnnotation}
        />
      </div>
      <div className="rounded-lg bg-zinc-900/80 p-3 text-zinc-100">
        <div className="mb-2 flex items-center gap-2 text-xs">
          {!isPlaying && canDraw ? <span className="text-amber-300">{t.player.pauseToComment}</span> : null}
          <span className="ml-auto rounded bg-zinc-700 px-1.5 py-0.5">{t.player.quality}</span>
        </div>
        <div
          className="mb-3 h-1.5 cursor-pointer rounded bg-zinc-700"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - rect.left) / rect.width;
            onSeek(Math.max(0, Math.min(durationSec, ratio * durationSec)));
          }}
        >
          <div className="h-full rounded bg-indigo-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            disabled={!canPlay}
            onClick={onPlayPause}
            className="rounded border border-zinc-600 p-1.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <span className="font-mono">
            {formatTimestamp(currentSec)} / {formatTimestamp(durationSec)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Volume2 className="h-4 w-4" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => onVolumeChange(Number(event.target.value))}
            />
          </span>
          <span className="inline-flex items-center gap-1">
            {t.player.speed}
            <select
              value={String(playbackRate)}
              className="rounded border border-zinc-600 bg-zinc-800 px-1"
              onChange={(event) => onPlaybackRateChange(Number(event.target.value))}
            >
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </span>
          <button
            type="button"
            className="ml-auto rounded border border-zinc-600 p-1.5 hover:bg-zinc-800"
            onClick={onToggleFullscreen}
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
