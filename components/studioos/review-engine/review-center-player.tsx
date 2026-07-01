"use client";

import { Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { cn } from "@/lib/utils";

export type PinDraft = { x: number; y: number; seconds: number };

const copy = {
  en: {
    pauseToClick: "Pause, then click the frame to annotate",
    addComment: "Add comment",
    submit: "Submit",
    placeholder: "Describe what should change…"
  },
  zh: {
    pauseToClick: "暂停后点击画面添加标注",
    addComment: "添加批注",
    submit: "提交",
    placeholder: "说明需要修改的内容…"
  }
};

export function ReviewCenterPlayer({
  locale,
  videoUrl,
  videoRef,
  stageRef,
  versionComments,
  pinDraft,
  pinText,
  activeCommentId,
  canAnnotate,
  canBrandReview,
  currentSec,
  durationSec,
  isPlaying,
  pending,
  onStageClick,
  onPinTextChange,
  onSaveComment,
  onCancelPin,
  onTogglePlay,
  onSeek,
  onSelectComment,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause
}: {
  locale: Locale;
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  versionComments: ReviewComment[];
  pinDraft: PinDraft | null;
  pinText: string;
  activeCommentId: string | null;
  canAnnotate: boolean;
  canBrandReview: boolean;
  currentSec: number;
  durationSec: number;
  isPlaying: boolean;
  pending: boolean;
  onStageClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onPinTextChange: (value: string) => void;
  onSaveComment: () => void;
  onCancelPin: () => void;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
  onSelectComment: (comment: ReviewComment) => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onPlay: () => void;
  onPause: () => void;
}) {
  const t = copy[locale];
  const progress = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;

  function pinVisible(comment: ReviewComment) {
    if (!isPlaying) return true;
    return Math.abs(currentSec - comment.timestamp_sec) < 0.35;
  }

  return (
    <div className="space-y-4">
      <div
        ref={stageRef}
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-950",
          canAnnotate ? "cursor-crosshair" : "cursor-default"
        )}
        onClick={onStageClick}
      >
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              key={videoUrl}
              src={videoUrl}
              className="h-full w-full object-contain"
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onPlay={onPlay}
              onPause={onPause}
              onClick={(event) => {
                event.stopPropagation();
                onTogglePlay();
              }}
            />

            {versionComments.map((comment, index) => {
              if (comment.pos_x == null || comment.pos_y == null || !pinVisible(comment)) return null;
              const active = activeCommentId === comment.id;
              return (
                <button
                  key={comment.id}
                  type="button"
                  data-pin-control
                  className={cn(
                    "absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white transition",
                    active ? "scale-110 bg-blue-600" : "bg-amber-500 hover:scale-105"
                  )}
                  style={{ left: `${comment.pos_x * 100}%`, top: `${comment.pos_y * 100}%` }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectComment(comment);
                  }}
                >
                  {index + 1}
                </button>
              );
            })}

            {pinDraft ? (
              <div
                data-pin-control
                className="absolute z-20 w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-200 bg-white p-3 shadow-xl"
                style={{ left: `${pinDraft.x * 100}%`, top: `${pinDraft.y * 100}%` }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">{t.addComment}</span>
                  <button type="button" onClick={onCancelPin} className="text-zinc-400 hover:text-zinc-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mb-2 font-mono text-xs text-blue-600">{formatTimestamp(pinDraft.seconds)}</p>
                <textarea
                  value={pinText}
                  onChange={(event) => onPinTextChange(event.target.value)}
                  rows={3}
                  autoFocus
                  placeholder={t.placeholder}
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      onSaveComment();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || !pinText.trim()}
                  onClick={onSaveComment}
                  className="mt-2 h-8 w-full rounded-lg bg-blue-600 hover:bg-blue-700"
                >
                  {t.submit}
                </Button>
              </div>
            ) : null}

            {!isPlaying && !pinDraft && canBrandReview ? (
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                {t.pauseToClick}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {videoUrl ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
            <span className="shrink-0 font-mono text-xs text-zinc-600">
              {formatTimestamp(currentSec)} / {formatTimestamp(durationSec)}
            </span>
            <div
              className="relative h-2 flex-1 cursor-pointer rounded-full bg-zinc-100"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const ratio = (event.clientX - rect.left) / rect.width;
                onSeek(Math.max(0, Math.min(durationSec, ratio * durationSec)));
              }}
            >
              <div className="absolute inset-y-0 left-0 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
              {durationSec > 0
                ? versionComments.map((comment, index) => (
                    <button
                      key={comment.id}
                      type="button"
                      className="absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-white"
                      style={{ left: `${Math.min((comment.timestamp_sec / durationSec) * 100, 99)}%` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectComment(comment);
                      }}
                    >
                      {index + 1}
                    </button>
                  ))
                : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
