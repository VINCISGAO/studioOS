"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReviewCommentAction } from "@/app/review-actions";
import { approveDeliveryAction, requestRevisionAction } from "@/app/order-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { BRAND_ISSUE_TYPES } from "@/lib/studioos/brand-campaign-display";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { ReviewComment } from "@/lib/studioos/review-store";
import { formatTimestamp } from "@/lib/studioos/review-utils";
import { cn } from "@/lib/utils";
import { CheckCircle2, Pause, Play, Plus, RotateCcw } from "lucide-react";

const copy = {
  en: {
    status: "Status",
    reviewNeeded: "Review Needed",
    version: (n: number) => `V${n}`,
    approve: "Approve",
    requestRevision: "Request Revision",
    openIssues: "Open Issues",
    resolved: "Resolved",
    revisionSummary: "Revision Summary",
    addIssue: "+ Add Issue",
    issueType: "Issue Type",
    comment: "Comment",
    submitIssue: "Add Issue",
    noVideo: "Waiting for studio to upload the first version.",
    completed: "Delivery approved.",
    revisionSent: "Revision requested.",
    timeline: "Timeline"
  },
  zh: {
    status: "状态",
    reviewNeeded: "待审片",
    version: (n: number) => `V${n}`,
    approve: "批准",
    requestRevision: "申请修改",
    openIssues: "待处理 Issue",
    resolved: "已解决",
    revisionSummary: "修改摘要",
    addIssue: "+ 添加 Issue",
    issueType: "Issue 类型",
    comment: "说明",
    submitIssue: "添加 Issue",
    noVideo: "等待 Studio 上传第一个版本。",
    completed: "交付已批准。",
    revisionSent: "已申请修改。",
    timeline: "时间轴"
  }
};

function revisionSummaryFromComments(comments: ReviewComment[], locale: Locale): string[] {
  return comments
    .filter((c) => c.status === "resolved")
    .map((c) => {
      const type = c.issue_type ?? "Update";
      const label =
        locale === "zh"
          ? `${type} 已更新`
          : `${type} updated`;
      return `✓ ${label}`;
    });
}

export function BrandCreativeReview({
  locale,
  order,
  campaignTitle,
  deliverables,
  initialComments,
  initialVersion,
  flash,
  projectId
}: {
  locale: Locale;
  order: StoredOrder;
  campaignTitle: string;
  deliverables: StoredDeliverable[];
  initialComments: ReviewComment[];
  initialVersion: number;
  flash?: "completed" | "revision";
  projectId?: string;
}) {
  const t = copy[locale];
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState(initialComments);
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
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [issueType, setIssueType] = useState<string>(BRAND_ISSUE_TYPES[0]);
  const [issueComment, setIssueComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeDeliverable =
    sortedVersions.find((v) => v.version === activeVersion) ?? sortedVersions[sortedVersions.length - 1];
  const videoUrl = activeDeliverable?.file_url ?? "";
  const versionComments = comments.filter((c) => c.version === activeVersion);
  const openIssues = versionComments.filter((c) => c.status === "open");
  const resolvedIssues = versionComments.filter((c) => c.status === "resolved");
  const canReview = ["review", "revision"].includes(order.status);
  const progress = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;
  const summaryLines = revisionSummaryFromComments(versionComments, locale);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
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
    v.currentTime = sec;
    setCurrentSec(sec);
  }

  function handleAddIssue() {
    if (!issueComment.trim()) return;
    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", order.id);
      fd.set("version", String(activeVersion));
      fd.set("timestamp_sec", String(Math.floor(currentSec)));
      fd.set("issue_type", issueType);
      fd.set("body", issueComment.trim());
      const result = await addReviewCommentAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setComments((prev) => [...prev, result.comment]);
      setIssueComment("");
      setShowAddIssue(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{campaignTitle}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {t.status}: <span className="font-medium text-zinc-900">{t.reviewNeeded}</span>
          </p>
        </div>
        {canReview ? (
          <div className="flex flex-wrap gap-2">
            <form action={requestRevisionAction}>
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="order_id" value={order.id} />
              {projectId ? <input type="hidden" name="project_id" value={projectId} /> : null}
              <Button type="submit" variant="outline" size="sm" className="rounded-full">
                <RotateCcw className="h-3.5 w-3.5" /> {t.requestRevision}
              </Button>
            </form>
            <form action={approveDeliveryAction}>
              <input type="hidden" name="lang" value={locale} />
              <input type="hidden" name="order_id" value={order.id} />
              {projectId ? <input type="hidden" name="project_id" value={projectId} /> : null}
              <Button type="submit" size="sm" className="rounded-full bg-zinc-900">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t.approve}
              </Button>
            </form>
          </div>
        ) : null}
      </div>

      {flash === "completed" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {t.completed}
        </div>
      ) : null}
      {flash === "revision" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t.revisionSent}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {sortedVersions.length ? (
          sortedVersions.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveVersion(v.version)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                v.version === activeVersion
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
              )}
            >
              {t.version(v.version)}
            </button>
          ))
        ) : (
          <p className="text-sm text-zinc-500">{t.noVideo}</p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          {videoUrl ? (
            <>
              <div className="overflow-hidden rounded-2xl bg-zinc-950 shadow-xl ring-1 ring-zinc-900/10">
                <video
                  ref={videoRef}
                  key={videoUrl}
                  src={videoUrl}
                  className="aspect-video w-full object-contain"
                  onTimeUpdate={() => setCurrentSec(videoRef.current?.currentTime ?? 0)}
                  onLoadedMetadata={() => setDurationSec(videoRef.current?.duration ?? 0)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={togglePlay}
                />
                <div className="border-t border-white/10 bg-zinc-950/95 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 shrink-0 rounded-full"
                      onClick={togglePlay}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-700"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const ratio = (e.clientX - rect.left) / rect.width;
                          seekTo(Math.max(0, Math.min(durationSec, ratio * durationSec)));
                        }}
                      >
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-white/90"
                          style={{ width: `${progress}%` }}
                        />
                        {durationSec > 0
                          ? versionComments.map((c) => (
                              <span
                                key={c.id}
                                className={cn(
                                  "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-zinc-950",
                                  c.status === "resolved" ? "bg-emerald-400" : "bg-amber-400"
                                )}
                                style={{
                                  left: `${Math.min((c.timestamp_sec / durationSec) * 100, 99)}%`
                                }}
                              />
                            ))
                          : null}
                      </button>
                      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-zinc-400">
                        <span>{formatTimestamp(currentSec)}</span>
                        <span>{durationSec ? formatTimestamp(durationSec) : "00:00"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {versionComments.length ? (
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.timeline}</p>
                  <ul className="mt-3 space-y-2">
                    {versionComments.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-50"
                          onClick={() => seekTo(c.timestamp_sec)}
                        >
                          <span className="font-mono text-xs text-zinc-400">
                            {formatTimestamp(c.timestamp_sec)}
                          </span>
                          <span className="font-medium text-zinc-700">{c.issue_type ?? "Issue"}</span>
                          <span className="truncate text-zinc-500">{c.body}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border bg-zinc-100 text-sm text-zinc-500">
              {t.noVideo}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{t.openIssues}</h2>
              {canReview ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setShowAddIssue((v) => !v)}
                >
                  <Plus className="h-3.5 w-3.5" /> {t.addIssue.replace("+ ", "")}
                </Button>
              ) : null}
            </div>
            {showAddIssue ? (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div>
                  <Label className="text-xs">{t.issueType}</Label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    {BRAND_ISSUE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">{t.comment}</Label>
                  <Textarea
                    value={issueComment}
                    onChange={(e) => setIssueComment(e.target.value)}
                    rows={3}
                    className="mt-1 resize-none text-sm"
                    placeholder={locale === "zh" ? "Logo 需要更大一些" : "Logo should be larger."}
                  />
                </div>
                <Input
                  readOnly
                  value={formatTimestamp(currentSec)}
                  className="font-mono text-center text-sm"
                />
                {error ? <p className="text-xs text-red-600">{error}</p> : null}
                <Button
                  type="button"
                  size="sm"
                  className="w-full rounded-full"
                  disabled={isPending || !issueComment.trim()}
                  onClick={handleAddIssue}
                >
                  {t.submitIssue}
                </Button>
              </div>
            ) : null}
            <ul className="mt-4 space-y-2">
              {openIssues.length ? (
                openIssues.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-sm"
                  >
                    <input type="checkbox" readOnly checked={false} className="mt-1" />
                    <div className="min-w-0">
                      <p className="font-medium">{c.issue_type ?? "Issue"}</p>
                      <p className="text-zinc-600">{c.body}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-zinc-400">{locale === "zh" ? "暂无待处理 Issue" : "No open issues"}</li>
              )}
            </ul>
          </div>

          {resolvedIssues.length ? (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="font-semibold">{t.resolved}</h2>
              <ul className="mt-3 space-y-2">
                {resolvedIssues.map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-sm text-zinc-600">
                    <input type="checkbox" readOnly checked className="mt-1" />
                    <span>
                      {c.issue_type}: {c.body}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summaryLines.length ? (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="font-semibold">{t.revisionSummary}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
                {summaryLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
