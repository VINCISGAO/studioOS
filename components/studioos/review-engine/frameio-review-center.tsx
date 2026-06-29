"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Pause, Play, RotateCcw, UploadCloud, X } from "lucide-react";
import { addReviewCommentAction, uploadVideoVersionAction } from "@/app/review-actions";
import { approveDeliveryAction, requestRevisionAction } from "@/app/order-actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    comments: "Comments",
    approve: "Approve",
    requestChanges: "Request changes",
    noVideo: "Waiting for the studio to upload the first version.",
    uploadVersion: "Upload new version",
    versionNotes: "Version notes (optional)",
    inReview: "In review",
    revision: "Revisions requested",
    completed: "Approved",
    pauseToClick: "Pause the video, then click the frame to comment",
    addComment: "Add comment",
    submit: "Submit",
    noComments: "No comments yet",
    brandHint: "Play → pause → click the video → write feedback",
    creatorHint: "Brand feedback appears here. Upload a new version when ready.",
    version: "Version",
    openComments: (n: number) => `${n} open`,
    allDone: "All changes done"
  },
  zh: {
    comments: "评论",
    approve: "通过",
    requestChanges: "重新修改",
    noVideo: "等待制作方上传视频。",
    uploadVersion: "上传新版本",
    versionNotes: "版本说明（可选）",
    inReview: "审片中",
    revision: "修改中",
    completed: "已通过",
    pauseToClick: "暂停视频后，点击画面添加评论",
    addComment: "发表评论",
    submit: "提交",
    noComments: "暂无评论",
    brandHint: "播放 → 暂停 → 点击画面 → 留言",
    creatorHint: "品牌方留言会显示在这里。修改完成后上传新版本。",
    version: "版本",
    openComments: (n: number) => `修改 ${n} 条`,
    allDone: "全部修改完成"
  }
};

type PinDraft = { x: number; y: number; seconds: number };

function orderStatusLabel(status: StoredOrder["status"], locale: Locale) {
  const t = copy[locale];
  if (status === "completed") return t.completed;
  if (status === "revision") return t.revision;
  return t.inReview;
}

export function FrameioReviewCenter({
  locale,
  order,
  campaignTitle,
  deliverables,
  initialComments,
  initialVersion,
  role,
  backHref,
  flash
}: {
  locale: Locale;
  order: StoredOrder;
  campaignTitle: string;
  deliverables: StoredDeliverable[];
  initialComments: ReviewComment[];
  initialVersion: number;
  role: "brand" | "creator";
  backHref: string;
  flash?: "completed" | "revision";
}) {
  const t = copy[locale];
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState(initialComments);
  const [uploadNotes, setUploadNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pinDraft, setPinDraft] = useState<PinDraft | null>(null);
  const [pinText, setPinText] = useState("");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const sortedVersions = useMemo(
    () => [...deliverables].sort((a, b) => a.version - b.version),
    [deliverables]
  );
  const [activeVersion, setActiveVersion] = useState(
    initialVersion || sortedVersions[sortedVersions.length - 1]?.version || 1
  );
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeDeliverable =
    sortedVersions.find((v) => v.version === activeVersion) ?? sortedVersions[sortedVersions.length - 1];
  const videoUrl = activeDeliverable?.file_url ?? "";
  const versionComments = useMemo(
    () =>
      [...comments.filter((c) => c.version === activeVersion)].sort(
        (a, b) => a.timestamp_sec - b.timestamp_sec
      ),
    [comments, activeVersion]
  );
  const openCount = versionComments.filter((c) => c.status === "open").length;
  const canBrandReview = role === "brand" && ["review", "revision"].includes(order.status);
  const canCreatorUpload = role === "creator" && ["in_production", "revision", "review"].includes(order.status);
  const canAnnotate = canBrandReview && !isPlaying && Boolean(videoUrl);
  const progress = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;
  const orderApproved = order.status === "completed";

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      setPinDraft(null);
      v.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }

  function seekTo(sec: number) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setIsPlaying(false);
    v.currentTime = sec;
    setCurrentSec(sec);
  }

  function handleStageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!canAnnotate || pinDraft) return;
    if ((e.target as HTMLElement).closest("[data-pin-control]")) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const v = videoRef.current;
    const seconds = v?.currentTime ?? currentSec;
    setPinDraft({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      seconds
    });
    setPinText("");
  }

  function handleSaveComment() {
    if (!pinDraft || !pinText.trim()) return;
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      fd.set("version", String(activeVersion));
      fd.set("timestamp_sec", String(pinDraft.seconds));
      fd.set("pos_x", String(pinDraft.x));
      fd.set("pos_y", String(pinDraft.y));
      fd.set("body", pinText.trim());
      const result = await addReviewCommentAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setComments((prev) => [...prev, result.comment]);
      setPinDraft(null);
      setPinText("");
      router.refresh();
    });
  }

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      fd.set("video_file", file);
      if (uploadNotes.trim()) fd.set("notes", uploadNotes.trim());
      const result = await uploadVideoVersionAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (fileRef.current) fileRef.current.value = "";
      setUploadNotes("");
      router.refresh();
    });
  }

  function handleApprove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      await approveDeliveryAction(fd);
      router.refresh();
    });
  }

  function handleRequestChanges() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      await requestRevisionAction(fd);
      router.refresh();
    });
  }

  function pinVisible(comment: ReviewComment) {
    if (!isPlaying) return true;
    return Math.abs(currentSec - comment.timestamp_sec) < 0.35;
  }

  return (
    <div className="flex min-h-svh flex-col bg-zinc-50 text-zinc-900">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{campaignTitle}</h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                orderApproved
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : order.status === "revision"
                    ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                    : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
              )}
            >
              {orderStatusLabel(order.status, locale)}
            </span>
            {activeDeliverable ? (
              <span className="text-xs text-zinc-500">
                {t.version} V{activeVersion}
              </span>
            ) : null}
            {openCount > 0 ? (
              <span className="text-xs text-zinc-500">{t.openComments(openCount)}</span>
            ) : null}
          </div>
        </div>
        {role === "brand" && canBrandReview ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={handleRequestChanges}
              className="rounded-lg border-zinc-200"
            >
              <RotateCcw className="h-4 w-4" />
              {t.requestChanges}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={handleApprove}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              {t.approve}
            </Button>
          </div>
        ) : null}
        <LanguageSwitcher locale={locale} />
      </header>

      {flash === "completed" || orderApproved ? (
        <div className="shrink-0 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-800">
          {locale === "zh" ? "交付已通过" : "Delivery approved"}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            ref={stageRef}
            className={cn(
              "relative flex flex-1 items-center justify-center bg-zinc-950",
              canAnnotate ? "cursor-crosshair" : "cursor-default"
            )}
            onClick={handleStageClick}
          >
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  key={videoUrl}
                  src={videoUrl}
                  className="max-h-[min(70vh,640px)] w-full object-contain"
                  onTimeUpdate={() => setCurrentSec(videoRef.current?.currentTime ?? 0)}
                  onLoadedMetadata={() => setDurationSec(videoRef.current?.duration ?? 0)}
                  onPlay={() => {
                    setIsPlaying(true);
                    setPinDraft(null);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                />

                {versionComments.map((comment) => {
                  if (comment.pos_x == null || comment.pos_y == null || !pinVisible(comment)) return null;
                  const active = activeCommentId === comment.id;
                  return (
                    <button
                      key={comment.id}
                      type="button"
                      data-pin-control
                      className={cn(
                        "absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white transition",
                        active ? "scale-125 bg-indigo-600" : "bg-amber-400 hover:scale-110"
                      )}
                      style={{ left: `${comment.pos_x * 100}%`, top: `${comment.pos_y * 100}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        seekTo(comment.timestamp_sec);
                        setActiveCommentId(comment.id);
                      }}
                      aria-label={comment.body}
                    />
                  );
                })}

                {pinDraft ? (
                  <div
                    data-pin-control
                    className="absolute z-20 w-56 -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-200 bg-white p-3 shadow-xl"
                    style={{ left: `${pinDraft.x * 100}%`, top: `${pinDraft.y * 100}%` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">{t.addComment}</span>
                      <button
                        type="button"
                        onClick={() => setPinDraft(null)}
                        className="text-zinc-400 hover:text-zinc-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mb-2 font-mono text-xs text-indigo-600">{formatTimestamp(pinDraft.seconds)}</p>
                    <textarea
                      value={pinText}
                      onChange={(e) => setPinText(e.target.value)}
                      rows={2}
                      autoFocus
                      placeholder={locale === "zh" ? "Logo 放大一点…" : "Logo should be bigger…"}
                      className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveComment();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending || !pinText.trim()}
                      onClick={handleSaveComment}
                      className="mt-2 h-8 w-full rounded-lg bg-zinc-900 hover:bg-zinc-800"
                    >
                      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.submit}
                    </Button>
                  </div>
                ) : null}

                {!isPlaying && !pinDraft && canBrandReview ? (
                  <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                    {t.pauseToClick}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="px-6 py-16 text-center text-sm text-zinc-400">
                {role === "creator" ? t.uploadVersion : t.noVideo}
              </div>
            )}
          </div>

          {videoUrl ? (
            <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                </button>
                <span className="shrink-0 font-mono text-xs text-zinc-600">
                  {formatTimestamp(currentSec)} / {formatTimestamp(durationSec)}
                </span>
                <div
                  className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-zinc-200"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    seekTo(Math.max(0, Math.min(durationSec, ratio * durationSec)));
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-indigo-600"
                    style={{ width: `${progress}%` }}
                  />
                  {durationSec > 0
                    ? versionComments.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 ring-2 ring-white hover:scale-125"
                          style={{ left: `${Math.min((c.timestamp_sec / durationSec) * 100, 99)}%` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            seekTo(c.timestamp_sec);
                            setActiveCommentId(c.id);
                          }}
                          aria-label={c.body}
                        />
                      ))
                    : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {sortedVersions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setActiveVersion(v.version);
                        setPinDraft(null);
                        setActiveCommentId(null);
                      }}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                        v.version === activeVersion
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      )}
                    >
                      V{v.version}
                    </button>
                  ))}
                </div>
                {role === "creator" && canCreatorUpload ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="video/mp4,.mp4"
                      className="max-w-[160px] text-xs text-zinc-500 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-2 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700"
                    />
                    <input
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder={t.versionNotes}
                      className="h-8 max-w-[180px] rounded-lg border border-zinc-200 px-2 text-xs outline-none focus:border-indigo-400"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={handleUpload}
                      className="h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      {t.uploadVersion}
                    </Button>
                  </div>
                ) : null}
              </div>
              {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
            </div>
          ) : role === "creator" && canCreatorUpload ? (
            <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/mp4,.mp4"
                  className="text-xs text-zinc-500 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                />
                <Button type="button" size="sm" disabled={pending} onClick={handleUpload} className="rounded-lg">
                  <UploadCloud className="h-4 w-4" />
                  {t.uploadVersion}
                </Button>
              </div>
              {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
            </div>
          ) : null}
        </div>

        <aside className="flex w-full shrink-0 flex-col border-t border-zinc-200 bg-white lg:w-[320px] lg:border-l lg:border-t-0 xl:w-[360px]">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">{t.comments}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {role === "brand" ? t.brandHint : t.creatorHint}
            </p>
          </div>

          <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto">
            {versionComments.length ? (
              versionComments.map((comment) => (
                <li key={comment.id} className="border-b border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      seekTo(comment.timestamp_sec);
                      setActiveCommentId(comment.id);
                    }}
                    className={cn(
                      "w-full px-4 py-4 text-left transition hover:bg-zinc-50",
                      activeCommentId === comment.id && "bg-indigo-50/60"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-indigo-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {formatTimestamp(comment.timestamp_sec)}
                    </span>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-800">{comment.body}</p>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-12 text-center text-sm text-zinc-400">{t.noComments}</li>
            )}
          </ul>

          {role === "creator" && openCount > 0 ? (
            <div className="shrink-0 border-t border-zinc-100 p-4">
              <p className="text-center text-xs text-zinc-500">{t.openComments(openCount)}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
