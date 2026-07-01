"use client";

import { Pause, Play } from "lucide-react";
import {
  ReviewAnnotationLayer,
  buildDraftAnnotation,
  finalizeAnnotation
} from "@/features/review/ReviewAnnotationLayer";
import type { ReviewAnnotation, ReviewComment, ReviewTool } from "@/features/review/review.types";
import { formatReviewTime, normalizePointer } from "@/features/review/review-format";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

export function ReviewVideoPlayer({
  videoUrl,
  videoRef,
  stageRef,
  comments,
  currentTime,
  duration,
  isPlaying,
  activeAnnotations,
  pendingAnnotations,
  activeTool,
  canDraw,
  activeCommentId,
  onCurrentTimeChange,
  onDurationChange,
  onPlayingChange,
  onSelectComment,
  onPendingAnnotationsChange
}: {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  comments: ReviewComment[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  activeAnnotations: ReviewAnnotation[];
  pendingAnnotations: ReviewAnnotation[];
  activeTool: ReviewTool;
  canDraw: boolean;
  activeCommentId: string | null;
  onCurrentTimeChange: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onSelectComment: (comment: ReviewComment) => void;
  onPendingAnnotationsChange: (next: ReviewAnnotation[]) => void;
}) {
  const [draftAnnotation, setDraftAnnotation] = useState<ReviewAnnotation | null>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function togglePlay() {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    if (video.paused) {
      void video
        .play()
        .then(() => onPlayingChange(true))
        .catch(() => onPlayingChange(false));
    } else {
      video.pause();
      onPlayingChange(false);
    }
  }

  function seekTo(time: number) {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    onPlayingChange(false);
    video.currentTime = time;
    onCurrentTimeChange(time);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!canDraw || !activeTool || !stageRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = normalizePointer(event.clientX, event.clientY, stageRef.current.getBoundingClientRect());
    drawStartRef.current = point;
    setDraftAnnotation(
      buildDraftAnnotation({
        type: activeTool,
        startX: point.x,
        startY: point.y,
        currentX: point.x,
        currentY: point.y,
        time: currentTime
      })
    );
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drawStartRef.current || !activeTool || !stageRef.current) return;
    const point = normalizePointer(event.clientX, event.clientY, stageRef.current.getBoundingClientRect());
    setDraftAnnotation(
      buildDraftAnnotation({
        type: activeTool,
        startX: drawStartRef.current.x,
        startY: drawStartRef.current.y,
        currentX: point.x,
        currentY: point.y,
        time: currentTime
      })
    );
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!draftAnnotation || draftAnnotation.id !== "draft") return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const finalized = finalizeAnnotation(draftAnnotation, currentTime);
    const tooSmall =
      finalized.type === "circle"
        ? (finalized.width ?? 0) < 0.01
        : finalized.type === "rect"
          ? (finalized.width ?? 0) < 0.01 && (finalized.height ?? 0) < 0.01
          : Math.hypot((finalized.endX ?? 0) - finalized.x, (finalized.endY ?? 0) - finalized.y) < 0.01;

    if (!tooSmall) {
      onPendingAnnotationsChange([...pendingAnnotations, finalized]);
    }
    drawStartRef.current = null;
    setDraftAnnotation(null);
  }

  return (
    <div className="space-y-4">
      <div ref={stageRef} className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-950 shadow-sm ring-1 ring-black/5">
        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          className="h-full w-full object-contain"
          onTimeUpdate={() => onCurrentTimeChange(videoRef.current?.currentTime ?? 0)}
          onLoadedMetadata={() => onDurationChange(videoRef.current?.duration ?? 0)}
          onPlay={() => onPlayingChange(true)}
          onPause={() => onPlayingChange(false)}
          onClick={(event) => {
            event.stopPropagation();
            togglePlay();
          }}
        />

        <ReviewAnnotationLayer
          activeAnnotations={activeAnnotations}
          pendingAnnotations={pendingAnnotations}
          draftAnnotation={draftAnnotation}
          activeTool={activeTool}
          canDraw={canDraw}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
          <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-600">
            {formatReviewTime(currentTime)} / {formatReviewTime(duration)}
          </span>
          <div
            className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-zinc-100"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const ratio = (event.clientX - rect.left) / rect.width;
              seekTo(Math.max(0, Math.min(duration, ratio * duration)));
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#5B5CFF]"
              style={{ width: `${progress}%` }}
            />
            {duration > 0
              ? comments.map((comment) => (
                  <button
                    key={comment.id}
                    type="button"
                    className={cn(
                      "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white transition",
                      activeCommentId === comment.id ? "scale-110 bg-[#5B5CFF]" : "bg-[#5B5CFF]/80 hover:scale-110"
                    )}
                    style={{ left: `${Math.min((comment.time / duration) * 100, 99.5)}%` }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectComment(comment);
                    }}
                  />
                ))
              : null}
          </div>
        </div>
      </div>
    </div>
  );
}
