"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { ReviewCommentPanel } from "@/features/review/ReviewCommentPanel";
import { ReviewVideoPlayer } from "@/features/review/ReviewVideoPlayer";
import type { ReviewAnnotation, ReviewComment, ReviewTool, ReviewVersion } from "@/features/review/review.types";
import type { Locale } from "@/lib/i18n";
import { cn, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back",
    version: "Version",
    approve: "Approve",
    requestChanges: "Request changes",
    inReview: "In review",
    revision: "Revisions requested",
    completed: "Approved",
    order: "Order",
    created: "Created",
    versions: "Versions",
    pauseHint: "Pause the video, pick a tool, draw on frame, then post your note."
  },
  zh: {
    back: "返回",
    version: "版本",
    approve: "通过",
    requestChanges: "请求修改",
    inReview: "审片中",
    revision: "修改中",
    completed: "已通过",
    order: "订单",
    created: "创建时间",
    versions: "版本记录",
    pauseHint: "暂停视频 → 选择工具 → 在画面上标注 → 发布意见。"
  }
};

export function ReviewWorkspace({
  locale,
  role,
  videoUrl,
  projectTitle,
  orderId,
  orderStatus = "review",
  createdAt,
  versions,
  activeVersion: controlledVersion,
  onVersionChange,
  backHref,
  backLabel,
  canBrandReview = role === "brand",
  onApprove,
  onRequestChanges,
  headerSlot,
  variant = "full",
  initialComments = []
}: {
  locale: Locale;
  role: "brand" | "creator";
  videoUrl: string;
  projectTitle: string;
  orderId: string;
  orderStatus?: "review" | "revision" | "completed" | "in_production";
  createdAt?: string;
  versions: ReviewVersion[];
  activeVersion?: number;
  onVersionChange?: (version: number) => void;
  backHref: string;
  backLabel?: string;
  canBrandReview?: boolean;
  onApprove?: () => void;
  onRequestChanges?: () => void;
  headerSlot?: React.ReactNode;
  variant?: "full" | "content";
  initialComments?: ReviewComment[];
}) {
  const t = copy[locale];
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => a.version - b.version),
    [versions]
  );
  const defaultVersion = controlledVersion ?? sortedVersions[sortedVersions.length - 1]?.version ?? 1;

  const [internalVersion, setInternalVersion] = useState(defaultVersion);
  const activeVersion = controlledVersion ?? internalVersion;

  function setActiveVersion(version: number) {
    if (onVersionChange) {
      onVersionChange(version);
      return;
    }
    setInternalVersion(version);
  }
  const [comments, setComments] = useState<ReviewComment[]>(initialComments);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [draftComment, setDraftComment] = useState("");
  const [pendingAnnotations, setPendingAnnotations] = useState<ReviewAnnotation[]>([]);
  const [activeAnnotations, setActiveAnnotations] = useState<ReviewAnnotation[]>([]);
  const [activeTool, setActiveTool] = useState<ReviewTool>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  useEffect(() => {
    setActiveCommentId(null);
    setActiveAnnotations([]);
    setPendingAnnotations([]);
    setDraftComment("");
    setActiveTool(null);
  }, [activeVersion]);

  const versionComments = useMemo(
    () => comments.filter((item) => item.version === activeVersion),
    [comments, activeVersion]
  );

  const canCompose = role === "brand" && canBrandReview && !isPlaying;
  const canDraw = canCompose && Boolean(activeTool);

  function handleSelectComment(comment: ReviewComment) {
    const video = videoRef.current;
    if (video) {
      video.currentTime = comment.time;
      video.pause();
    }
    setCurrentTime(comment.time);
    setIsPlaying(false);
    setActiveCommentId(comment.id);
    setActiveAnnotations(comment.annotations);
    setPendingAnnotations([]);
    setActiveTool(null);
  }

  const handleAddComment = () => {
    if (!draftComment.trim()) return;

    const comment: ReviewComment = {
      id: crypto.randomUUID(),
      time: currentTime,
      content: draftComment.trim(),
      createdBy: locale === "zh" ? "品牌方" : "Brand",
      createdAt: new Date().toISOString(),
      version: activeVersion,
      annotations: pendingAnnotations
    };

    setComments((prev) => [comment, ...prev]);
    setDraftComment("");
    setPendingAnnotations([]);
    setActiveTool(null);
    setActiveCommentId(comment.id);
    setActiveAnnotations(comment.annotations);
  };

  function statusLabel() {
    if (orderStatus === "completed") return t.completed;
    if (orderStatus === "revision") return t.revision;
    return t.inReview;
  }

  return (
    <div
      className={cn(
        variant === "full" && "overflow-hidden rounded-2xl border border-zinc-200/80 bg-white text-zinc-900 shadow-sm"
      )}
    >
      {variant === "full" ? (
        <header className="border-b border-zinc-100 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start gap-3">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {backLabel ?? t.back}
            </Link>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-950">{projectTitle}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                <span>
                  {t.order}: {orderId}
                </span>
                {createdAt ? (
                  <span>
                    {t.created}: {formatDate(createdAt)}
                  </span>
                ) : null}
                <span>
                  {t.version} {activeVersion}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 font-medium",
                    orderStatus === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : orderStatus === "revision"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-[#5B5CFF]/10 text-[#5B5CFF]"
                  )}
                >
                  {statusLabel()}
                </span>
              </div>
            </div>

            {role === "brand" && canBrandReview ? (
              <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto">
                <button
                  type="button"
                  onClick={onRequestChanges}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.requestChanges}
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t.approve}
                </button>
              </div>
            ) : null}
          </div>

          {headerSlot}
        </header>
      ) : null}

      <div className={cn("grid min-h-0 gap-5", variant === "full" ? "p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]" : "xl:grid-cols-[minmax(0,1fr)_360px]")}>
        <div className="min-w-0 space-y-4">
          {videoUrl ? (
            <ReviewVideoPlayer
              videoUrl={videoUrl}
              videoRef={videoRef}
              stageRef={stageRef}
              comments={versionComments}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              activeAnnotations={activeAnnotations}
              pendingAnnotations={pendingAnnotations}
              activeTool={activeTool}
              canDraw={canDraw}
              activeCommentId={activeCommentId}
              onCurrentTimeChange={setCurrentTime}
              onDurationChange={setDuration}
              onPlayingChange={(playing) => {
                setIsPlaying(playing);
                if (playing) {
                  setActiveTool(null);
                  setPendingAnnotations([]);
                }
              }}
              onSelectComment={handleSelectComment}
              onPendingAnnotationsChange={setPendingAnnotations}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
              {locale === "zh" ? "等待视频上传" : "Waiting for video upload"}
            </div>
          )}

          {sortedVersions.length ? (
            <div className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{t.versions}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sortedVersions.map((item) => (
                  <button
                    key={item.version}
                    type="button"
                    onClick={() => {
                      setActiveVersion(item.version);
                      setActiveCommentId(null);
                      setActiveAnnotations([]);
                      setPendingAnnotations([]);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      activeVersion === item.version
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    )}
                  >
                    V{item.version}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600">
            {t.pauseHint}
          </p>
        </div>

        <ReviewCommentPanel
          locale={locale}
          role={role}
          currentTime={currentTime}
          comments={versionComments}
          activeCommentId={activeCommentId}
          draftComment={draftComment}
          pendingAnnotations={pendingAnnotations}
          activeTool={activeTool}
          canCompose={canCompose}
          onDraftChange={setDraftComment}
          onToolChange={setActiveTool}
          onPublish={handleAddComment}
          onSelectComment={handleSelectComment}
        />
      </div>
    </div>
  );
}
