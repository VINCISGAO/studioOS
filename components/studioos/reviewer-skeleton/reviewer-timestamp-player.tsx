"use client";

import { useEffect, useState } from "react";
import { ReviewerAppleVideoChrome } from "@/components/studioos/reviewer-skeleton/reviewer-apple-video-chrome";
import { useReviewerVideoChrome } from "@/components/studioos/reviewer-skeleton/use-reviewer-video-chrome";
import { ReviewerV1AnnotationLayer } from "@/components/studioos/reviewer-v1/reviewer-v1-annotation-layer";
import type { ReviewerAnnotationShape, ReviewerTool } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import type { ReviewerVideoStatus } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import type { Locale } from "@/lib/i18n";
import { getReviewerV1Copy } from "@/components/studioos/reviewer-v1/reviewer-v1-copy";
import { cn } from "@/lib/utils";

export function ReviewerTimestampPlayer({
  locale,
  role,
  compact = false,
  focusLayout = false,
  focusDark = false,
  portalLayout = false,
  activeVersion = 1,
  playbackVersion,
  latestVersion,
  reviewCompleted = false,
  videoUrl,
  videoRef,
  videoStatus,
  isPlaying,
  currentSec,
  durationSec,
  canDraw,
  activeTool,
  penColor,
  penSize,
  annotations,
  pendingAnnotations = [],
  onCreateAnnotation,
  onSelectAnnotation,
  onDeleteAnnotation,
  onClearSelection,
  onPlayPause,
  onSeek,
  onTimeUpdate,
  onLoadedMetadata,
  onLoadedData,
  onDurationChange,
  onCanPlay,
  onError,
  onPlay,
  onPause,
  onEnded
}: {
  locale: Locale;
  role: "brand" | "creator";
  compact?: boolean;
  focusLayout?: boolean;
  focusDark?: boolean;
  portalLayout?: boolean;
  activeVersion?: number;
  playbackVersion: number;
  latestVersion?: number;
  reviewCompleted?: boolean;
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoStatus: ReviewerVideoStatus;
  isPlaying: boolean;
  currentSec: number;
  durationSec: number;
  canDraw: boolean;
  activeTool: ReviewerTool;
  penColor: string;
  penSize: number;
  annotations: ReviewerAnnotationShape[];
  pendingAnnotations?: ReviewerAnnotationShape[];
  onCreateAnnotation: (annotation: ReviewerAnnotationShape, suggestedBody?: string) => void;
  onSelectAnnotation?: (annotationId: string) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  onClearSelection?: () => void;
  onPlayPause: () => void;
  onSeek: (sec: number) => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onLoadedData: () => void;
  onDurationChange: () => void;
  onCanPlay: () => void;
  onError: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}) {
  const t = getReviewerV1Copy(locale);
  const canPlay = Boolean(videoUrl) && videoStatus !== "error";
  const [volume, setVolume] = useState(1);
  const { containerRef, isFullscreen, controlsVisible, revealControls, toggleFullscreen } =
    useReviewerVideoChrome(isPlaying);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = volume <= 0.001;
  }, [videoRef, volume, playbackVersion, videoUrl]);

  const statusHint =
    role === "brand"
      ? isPlaying
        ? t.player.pauseToComment
        : locale === "zh"
          ? "已暂停，可留言或在画面上批注"
          : "Paused — comment or annotate on the frame"
      : t.comments.brandOnly;

  const draftBadge =
    locale === "zh"
      ? ["第一稿", "第二稿", "第三稿", "第四稿", "第五稿"][playbackVersion - 1] ?? `V${playbackVersion}`
      : ["Draft 1", "Draft 2", "Draft 3", "Draft 4", "Draft 5"][playbackVersion - 1] ?? `V${playbackVersion}`;
  const resolvedLatestVersion = latestVersion ?? playbackVersion;
  const versionBadgeSuffix =
    playbackVersion < resolvedLatestVersion
      ? locale === "zh"
        ? " (已完成)"
        : " (done)"
      : reviewCompleted
        ? locale === "zh"
          ? " (已通过)"
          : " (approved)"
        : locale === "zh"
          ? portalLayout
            ? " (当前审核)"
            : " (当前审批)"
          : portalLayout
            ? " (in review)"
            : " (in review)";
  const showVersionBadge = focusLayout || portalLayout;

  return (
    <section
      className={cn(
        "w-full overflow-hidden",
        focusLayout
          ? focusDark
            ? "flex min-h-0 w-full max-w-full flex-1 flex-col bg-zinc-950"
            : "flex min-h-0 w-full max-w-full flex-1 flex-col bg-white"
          : portalLayout
            ? "shrink-0 rounded-2xl border border-zinc-200 bg-white shadow-sm"
            : "shrink-0 rounded-xl border border-zinc-200 bg-zinc-950 shadow-sm",
        compact && !focusLayout && "flex min-h-0 shrink-0 flex-col",
        isFullscreen && "rounded-none border-0 shadow-none"
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          "group relative w-full",
          isFullscreen
            ? "flex h-full w-full items-center justify-center bg-zinc-950"
            : focusLayout
              ? focusDark
                ? "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-zinc-950 max-lg:rounded-none lg:items-center lg:justify-center lg:rounded-xl"
                : "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white max-lg:rounded-none lg:items-center lg:justify-center lg:rounded-xl"
              : portalLayout
                ? "relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
                : compact
                ? "h-[min(34vh,260px)] min-h-[140px] bg-zinc-950"
                : "aspect-video bg-zinc-950 lg:mx-auto lg:h-[min(52dvh,calc(100dvh-360px))] lg:min-h-[220px] lg:w-auto lg:max-w-full",
          isFullscreen && "bg-zinc-950"
        )}
        onMouseMove={revealControls}
      >
        <div
          className={cn(
            "relative w-full",
            focusLayout
              ? "max-lg:h-full max-lg:min-h-0 max-lg:flex-1 lg:h-full lg:w-full"
              : "h-full",
            focusLayout && (focusDark ? "bg-black lg:rounded-xl" : "bg-white lg:rounded-xl")
          )}
        >
        {showVersionBadge ? (
          <span
            className={cn(
              "absolute top-2 z-30 rounded-lg bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]",
              focusLayout
                ? "left-1/2 -translate-x-1/2 max-lg:text-[9px] lg:left-3 lg:translate-x-0"
                : "left-2 max-md:text-[9px]"
            )}
          >
            {draftBadge}
            {versionBadgeSuffix}
          </span>
        ) : null}

        {portalLayout ? (
          <button
            type="button"
            className="absolute right-3 top-3 z-30 rounded-lg border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            {locale === "zh" ? "对比" : "Compare"}
          </button>
        ) : null}

        <div className={cn("relative h-full w-full", focusLayout && "max-lg:flex max-lg:items-start")}>
          {videoUrl && videoStatus !== "error" ? (
            <video
              ref={videoRef}
              key={`${playbackVersion}:${videoUrl}`}
              src={videoUrl}
              className={cn(
                "h-full w-full object-contain",
                focusLayout && "max-lg:h-auto max-lg:w-full",
                portalLayout && "bg-black",
                focusLayout && (focusDark ? "bg-black" : "bg-white"),
                isFullscreen && "max-h-full max-w-full"
              )}
              playsInline
              preload="auto"
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onLoadedData={onLoadedData}
              onDurationChange={onDurationChange}
              onCanPlay={onCanPlay}
              onError={onError}
              onPlay={onPlay}
              onPause={onPause}
              onEnded={onEnded}
              onClick={activeTool === "select" ? onPlayPause : undefined}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-400">
              {videoStatus === "missing"
                ? t.player.videoMissing
                : videoStatus === "loading"
                  ? t.player.loadingVideo
                  : t.player.videoLoadFailed}
            </div>
          )}
        </div>

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
          onSelectAnnotation={onSelectAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
          onClearSelection={onClearSelection}
        />

        {canPlay ? (
          <ReviewerAppleVideoChrome
            locale={locale}
            compact={compact}
            focusLayout={focusLayout}
            canPlay={canPlay}
            isPlaying={isPlaying}
            isFullscreen={isFullscreen}
            controlsVisible={controlsVisible}
            showCenterPlay={activeTool === "select"}
            currentSec={currentSec}
            durationSec={durationSec}
            volume={volume}
            onPlayPause={onPlayPause}
            onSeek={onSeek}
            onVolumeChange={setVolume}
            onToggleFullscreen={() => void toggleFullscreen()}
            onRevealControls={revealControls}
          />
        ) : null}
        </div>
      </div>

      {!compact && !focusLayout && !portalLayout && !isFullscreen ? (
        <p className="border-t border-white/5 bg-zinc-950 px-4 py-2 text-[11px] text-zinc-500">{statusHint}</p>
      ) : null}
    </section>
  );
}
