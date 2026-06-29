"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addReviewCommentAction,
  resolveReviewCommentAction
} from "@/app/review-actions";
import { DeliveryUploadPanel } from "@/components/studioos/delivery-upload-panel";
import { DeliverableNotesBlock } from "@/components/studioos/deliverable-notes-block";
import { ReviewWatermarkOverlay } from "@/components/studioos/review-watermark-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { deliverableNotesForViewer } from "@/lib/studioos/deliverable-notes";
import { cn } from "@/lib/utils";
import { CheckCircle2, MessageSquarePlus, Pause, Play } from "lucide-react";
import type { ReactNode } from "react";

type VideoReviewPlayerProps = {
  locale: Locale;
  orderId: string;
  role: "brand" | "studio";
  versions: StoredDeliverable[];
  initialComments: ReviewComment[];
  initialVersion?: number;
  canUpload?: boolean;
  layout?: "default" | "workspace";
  brandName?: string;
  brandEmail?: string;
  sessionId?: string;
  sidebar?: ReactNode;
};

export function VideoReviewPlayer({
  locale,
  orderId,
  role,
  versions,
  initialComments,
  initialVersion,
  canUpload = false,
  layout = "default",
  brandName,
  brandEmail,
  sessionId,
  sidebar
}: VideoReviewPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPending, startTransition] = useTransition();
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => a.version - b.version),
    [versions]
  );
  const defaultVersion = initialVersion ?? sortedVersions[sortedVersions.length - 1]?.version ?? 1;
  const [activeVersion, setActiveVersion] = useState(defaultVersion);
  const [comments, setComments] = useState(initialComments);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeDeliverable =
    sortedVersions.find((item) => item.version === activeVersion) ?? sortedVersions[sortedVersions.length - 1];
  const videoUrl = activeDeliverable?.file_url ?? "";
  const versionComments = comments.filter((item) => item.version === activeVersion);
  const hasVersions = sortedVersions.length > 0;
  const notesView = activeDeliverable
    ? deliverableNotesForViewer(activeDeliverable, role, locale)
    : null;

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    setActiveVersion(defaultVersion);
  }, [defaultVersion, orderId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    video.load();
    setCurrentSec(0);
    setIsPlaying(false);
  }, [videoUrl]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => undefined);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function seekTo(sec: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = sec;
    setCurrentSec(sec);
    video.play().catch(() => undefined);
    setIsPlaying(true);
  }

  function switchVersion(version: number) {
    setActiveVersion(version);
    setError(null);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      fd.set("version", String(activeVersion));
      fd.set("timestamp_sec", String(Math.floor(currentSec)));
      fd.set("body", note);
      const result = await addReviewCommentAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setComments((prev) => [...prev, result.comment]);
      setNote("");
      router.refresh();
    });
  }

  function handleResolve(commentId: string) {
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      fd.set("comment_id", commentId);
      const result = await resolveReviewCommentAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setComments((prev) =>
        prev.map((item) => (item.id === commentId ? { ...item, status: "resolved", resolved_at: result.comment.resolved_at } : item))
      );
      router.refresh();
    });
  }

  const copy =
    locale === "zh"
      ? {
          versions: "版本",
          versionLabel: (v: number) => `版本 ${v}`,
          addNote: "在当前时间点添加批注",
          add: "添加批注",
          open: "待处理",
          resolved: "已解决",
          resolve: "标记已解决",
          noComments: "此版本还没有批注。",
          play: "播放",
          pause: "暂停",
          noVideoStudio: "还没有可审片的版本",
          noVideoStudioBody: "请先在「交付工作台」提交 Version 1，再回来审片。",
          noVideoBrand: "Studio 尚未上传初稿",
          noVideoBrandBody: "品牌审片会在 Studio 提交 Version 1 后开放。",
          backUpload: "返回交付工作台",
          timelineComments: "时间轴评论",
          reviewBadge: "审片版",
          reviewCopy: "审片版 · 禁止商用"
        }
      : {
          versions: "Versions",
          versionLabel: (v: number) => `Version ${v}`,
          addNote: "Add note at current timestamp",
          add: "Add comment",
          open: "Open",
          resolved: "Resolved",
          resolve: "Mark resolved",
          noComments: "No comments on this version yet.",
          play: "Play",
          pause: "Pause",
          noVideoStudio: "No version to review yet",
          noVideoStudioBody: "Submit Version 1 from Delivery Workspace first.",
          noVideoBrand: "Waiting for studio upload",
          noVideoBrandBody: "Brand review opens after the studio submits Version 1.",
          backUpload: "Back to Delivery Workspace",
          timelineComments: "Timeline comments",
          reviewBadge: "Review Version",
          reviewCopy: "Review copy · commercial use prohibited"
        };

  if (!hasVersions) {
    return (
      <div className="space-y-6">
        {role === "studio" && canUpload ? (
          <>
            <DeliveryUploadPanel
              locale={locale}
              orderId={orderId}
              nextVersion={1}
              mode="first"
              onSuccess={() => router.refresh()}
            />
            <p className="text-center text-sm text-zinc-500">
              <Link href={withLocale("/studio/delivery", locale)} className="underline underline-offset-4">
                {copy.backUpload}
              </Link>
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
            <p className="font-medium text-zinc-900">
              {role === "studio" ? copy.noVideoStudio : copy.noVideoBrand}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {role === "studio" ? copy.noVideoStudioBody : copy.noVideoBrandBody}
            </p>
            {role === "studio" ? (
              <Button asChild className="mt-6 rounded-full">
                <Link href={withLocale("/studio/delivery", locale)}>{copy.backUpload}</Link>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  const versionSwitcher = (
    <div className="flex flex-wrap gap-2">
      {sortedVersions.map((item) => (
        <Button
          key={item.id}
          type="button"
          size="sm"
          variant={item.version === activeVersion ? "default" : "outline"}
          onClick={() => switchVersion(item.version)}
        >
          {copy.versionLabel(item.version)}
        </Button>
      ))}
    </div>
  );

  const videoBlock = (
    <div className="space-y-3">
      {layout === "workspace" ? versionSwitcher : null}
      <div className="relative overflow-hidden rounded-xl bg-zinc-900">
        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onContextMenu={(event) => event.preventDefault()}
          className="aspect-video w-full object-contain"
          onTimeUpdate={() => setCurrentSec(videoRef.current?.currentTime ?? 0)}
          onLoadedMetadata={() => setDurationSec(videoRef.current?.duration ?? 0)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {layout === "workspace" && brandName && brandEmail && sessionId ? (
          <ReviewWatermarkOverlay
            locale={locale}
            brandName={brandName}
            brandEmail={brandEmail}
            sessionId={sessionId}
          />
        ) : null}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? copy.pause : copy.play}
          </Button>
          <span className="rounded-md bg-black/70 px-2 py-1 font-mono text-xs text-white">
            {formatTimestamp(currentSec)}
            {durationSec ? ` / ${formatTimestamp(durationSec)}` : ""}
          </span>
        </div>
        {layout === "workspace" ? (
          <div className="absolute right-3 top-3 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
            {copy.reviewBadge} v{activeVersion}
          </div>
        ) : null}
      </div>
      {layout === "workspace" ? (
        <p className="text-center text-xs text-zinc-500">{copy.reviewCopy}</p>
      ) : null}
      {durationSec > 0 ? (
        <div className="relative h-2 overflow-hidden rounded-full bg-zinc-200">
          {versionComments.map((comment) => (
            <button
              key={`marker-${comment.id}`}
              type="button"
              title={comment.body}
              onClick={() => seekTo(comment.timestamp_sec)}
              className={cn(
                "absolute top-0 h-full w-1.5 -translate-x-1/2 rounded-full",
                comment.status === "resolved" ? "bg-emerald-500" : "bg-zinc-900"
              )}
              style={{ left: `${Math.min((comment.timestamp_sec / durationSec) * 100, 99)}%` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  const commentsBlock = (
    <div className="rounded-xl border bg-white">
      <div className="border-b px-4 py-3 text-sm font-medium">
        {layout === "workspace" ? copy.timelineComments : `${copy.versions} ${activeVersion}`} ·{" "}
        {versionComments.length} {locale === "zh" ? "条批注" : "comments"}
      </div>
      {versionComments.length ? (
        <ul className={cn("divide-y", layout === "workspace" && "max-h-[420px] overflow-y-auto")}>
          {versionComments.map((comment) => (
            <li key={comment.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                onClick={() => seekTo(comment.timestamp_sec)}
                className="flex min-w-0 flex-1 gap-4 text-left transition hover:opacity-80"
              >
                <span className="flex shrink-0 items-center gap-1 font-mono text-sm font-semibold text-zinc-900">
                  <Play className="h-3 w-3" />
                  {formatTimestamp(comment.timestamp_sec)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-700">{comment.body}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {comment.author === "brand" ? "Brand" : "Studio"}
                  </p>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={comment.status === "resolved" ? "secondary" : "outline"}>
                  {comment.status === "resolved" ? copy.resolved : copy.open}
                </Badge>
                {role === "studio" && comment.status === "open" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleResolve(comment.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {copy.resolve}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">{copy.noComments}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {layout === "default" ? versionSwitcher : null}

      {notesView && layout === "default" ? (
        <div className="rounded-xl border bg-zinc-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {locale === "zh" ? "版本说明" : "Version notes"}
          </p>
          <DeliverableNotesBlock locale={locale} view={notesView} className="mt-2" />
        </div>
      ) : null}

      {layout === "workspace" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_280px]">
          <div className="space-y-4">{videoBlock}</div>
          <div className="space-y-4">
            {notesView ? (
              <div className="rounded-xl border bg-zinc-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {locale === "zh" ? "版本说明" : "Version notes"}
                </p>
                <DeliverableNotesBlock locale={locale} view={notesView} className="mt-2" />
              </div>
            ) : null}
            {commentsBlock}
          </div>
          {sidebar ? <div>{sidebar}</div> : null}
        </div>
      ) : (
        <>
          {videoBlock}
          {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          {role === "brand" ? (
            <form onSubmit={handleAddComment} className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquarePlus className="h-4 w-4" />
                {copy.addNote}
              </div>
              <div className="mt-3 flex gap-2">
                <Input readOnly value={formatTimestamp(currentSec)} className="w-24 text-center font-mono" />
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={locale === "zh" ? "例如：Logo 太小" : "e.g. Logo too small"}
                  rows={2}
                  className="flex-1"
                />
              </div>
              <Button type="submit" size="sm" className="mt-3" disabled={isPending || !note.trim()}>
                {copy.add}
              </Button>
            </form>
          ) : null}
          {commentsBlock}
          {role === "studio" && canUpload ? (
            <div className="rounded-xl border bg-white p-4">
              <DeliveryUploadPanel
                locale={locale}
                orderId={orderId}
                nextVersion={sortedVersions.length + 1}
                mode="revision"
                onSuccess={() => router.refresh()}
              />
            </div>
          ) : null}
        </>
      )}

      {layout === "workspace" && error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
