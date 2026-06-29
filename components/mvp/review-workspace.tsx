"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addMvpCommentAction,
  approveFinalAction,
  requestMvpRevisionAction,
  uploadMvpVideoAction
} from "@/app/mvp-actions";
import { Button } from "@/components/ui/button";
import type { MvpProfile, MvpRole, ReviewProject, VideoComment, VideoVersion } from "@/lib/mvp/types";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { wsCopy } from "@/lib/mvp/workspace-copy";
import { getReviewDemoData, versionStatusLabel } from "@/lib/mvp/review-demo-data";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Maximize2,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Send,
  Settings,
  Share2,
  Sparkles,
  Upload,
  Volume2,
  X,
  XCircle
} from "lucide-react";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type PinDraft = { x: number; y: number; seconds: number };
type CommentPin = { x: number; y: number };
type BottomTab = "versions" | "suggestions" | "comments" | "deliverables";

const ui = {
  en: {
    reviewCenter: "Review center",
    inProgress: "In progress",
    share: "Share",
    submitDecision: "Submit decision",
    aiAssistant: "AI Review Assistant",
    aiScore: "AI Score",
    history: "History",
    deliverables: "Deliverables",
    switchVersion: "Switch version",
    addMarker: "Add marker",
    pass: "Passed",
    suggestRevision: "Suggest revision",
    commentHere: "Comment here…",
    save: "Save",
    clickToAnnotate: "Click frame to annotate",
    tabVersions: "Version history",
    tabSuggestions: "AI suggestions",
    tabComments: "Comments",
    tabDeliverables: "Deliverables",
    uploadNew: "Upload new version",
    apply: "Apply suggestions",
    commentPlaceholder: "Add a comment… @mention",
    needsRevision: "Needs revision",
    needsRevisionSub: "Return to creator",
    requestChanges: "Request changes",
    requestChangesSub: "Submit specific feedback",
    approve: "Approve",
    approveSub: "Confirm and proceed to next stage"
  },
  zh: {
    reviewCenter: "审片中心",
    inProgress: "进行中",
    share: "分享",
    submitDecision: "提交决定",
    aiAssistant: "AI 审核助手",
    aiScore: "AI 评分",
    history: "历史记录",
    deliverables: "交付物",
    switchVersion: "切换版本",
    addMarker: "添加标记",
    pass: "通过",
    suggestRevision: "建议修改",
    commentHere: "Comment here…",
    save: "保存",
    clickToAnnotate: "点击画面添加批注",
    tabVersions: "版本历史",
    tabSuggestions: "AI 建议",
    tabComments: "协作评论",
    tabDeliverables: "交付物",
    uploadNew: "上传新版本",
    apply: "Apply 建议",
    commentPlaceholder: "添加评论… @提及",
    needsRevision: "需要修改",
    needsRevisionSub: "退回给创作者修改",
    requestChanges: "请求修改",
    requestChangesSub: "提交具体修改意见",
    approve: "批准通过",
    approveSub: "确认并进入下一阶段"
  }
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
      <svg className="-rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="10" />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="#18181b"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-semibold tracking-tight text-zinc-950">{score}</p>
        <p className="text-xs text-zinc-400">/ 100</p>
      </div>
    </div>
  );
}

function CampaignProgressBar({ locale }: { locale: Locale }) {
  const demo = getReviewDemoData(locale);
  const active = demo.activeStepIndex;

  return (
    <div className="rounded-[20px] border border-zinc-200/80 bg-white px-4 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {demo.steps.map((step, index) => {
          const done = index < active;
          const current = index === active;
          return (
            <div key={step.title} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done ? "bg-emerald-500 text-white" : current ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className={cn("text-sm font-semibold", current ? "text-zinc-900" : "text-zinc-700")}>{step.title}</p>
                <p className="text-xs text-zinc-400">{step.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewWorkspace({
  locale = "zh",
  project,
  versions,
  comments: initialComments,
  profiles,
  role,
  flash
}: {
  locale?: Locale;
  project: ReviewProject;
  versions: VideoVersion[];
  comments: VideoComment[];
  profiles: Record<string, MvpProfile>;
  role: MvpRole;
  flash?: "approved" | "revision";
}) {
  const t = wsCopy("review", locale);
  const u = ui[locale];
  const demo = getReviewDemoData(locale);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState(initialComments);
  const [activeVersionId, setActiveVersionId] = useState(versions[versions.length - 1]?.id ?? "");
  const [currentSec, setCurrentSec] = useState(4);
  const [durationSec, setDurationSec] = useState(28);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinDraft, setPinDraft] = useState<PinDraft | null>(null);
  const [pinText, setPinText] = useState("");
  const [pins, setPins] = useState<Record<string, CommentPin>>({});
  const [bottomTab, setBottomTab] = useState<BottomTab>("comments");
  const [chatDraft, setChatDraft] = useState("");

  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[versions.length - 1];
  const projectTitle = project.title;

  const versionComments = useMemo(
    () =>
      [...comments.filter((c) => c.video_version_id === activeVersion?.id)].sort(
        (a, b) => a.timestamp_seconds - b.timestamp_seconds
      ),
    [comments, activeVersion?.id]
  );

  const canApprove = role === "brand" && ["in_review", "revision"].includes(project.status);
  const canAnnotate = role === "brand" && activeVersion && project.status !== "approved";
  const canUpload = role === "studio" && project.assigned_studio_id && project.status !== "approved";
  const progress = durationSec > 0 ? (currentSec / durationSec) * 100 : 0;

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

  function handleStageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!canAnnotate || pinDraft) return;
    if ((e.target as HTMLElement).closest("[data-pin-control]")) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPinDraft({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      seconds: currentSec
    });
    setPinText("");
  }

  function savePinComment() {
    if (!pinDraft || !pinText.trim() || !activeVersion) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("project_id", project.id);
      fd.set("video_version_id", activeVersion.id);
      fd.set("timestamp_seconds", String(Math.floor(pinDraft.seconds)));
      fd.set("comment_text", pinText.trim());
      const result = await addMvpCommentAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setComments((prev) => [...prev, result.comment]);
      setPins((prev) => ({ ...prev, [result.comment.id]: { x: pinDraft.x, y: pinDraft.y } }));
      setPinDraft(null);
      setPinText("");
      router.refresh();
    });
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("project_id", project.id);
      fd.set("video_file", file);
      const result = await uploadMvpVideoAction(fd);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const tabs: { id: BottomTab; label: string; count?: number }[] = [
    { id: "versions", label: u.tabVersions },
    { id: "suggestions", label: u.tabSuggestions, count: demo.suggestions.length },
    { id: "comments", label: u.tabComments, count: demo.chat.length },
    { id: "deliverables", label: u.tabDeliverables }
  ];

  return (
    <div className="space-y-5 pb-36">
      {/* Breadcrumb + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <Link href={withLocale("/workspace/studio", locale)} className="text-zinc-500 hover:text-zinc-900">
            {u.reviewCenter}
          </Link>
          <span className="text-zinc-300">›</span>
          <span className="truncate font-medium text-zinc-900">{projectTitle}</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/70">
            {u.inProgress}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-zinc-500">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg border-zinc-200">
            <Share2 className="h-4 w-4" />
            {u.share}
          </Button>
          {canApprove ? (
            <form action={approveFinalAction}>
              <input type="hidden" name="project_id" value={project.id} />
              <Button type="submit" size="sm" className="h-9 rounded-lg bg-zinc-900 px-4 hover:bg-zinc-800">
                {u.submitDecision}
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <CampaignProgressBar locale={locale} />

      {flash === "approved" ? (
        <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{t.approvedFlash}</div>
      ) : null}
      {flash === "revision" ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t.revisionFlash}</div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        {/* Left column */}
        <div className="space-y-5">
          {activeVersion ? (
            <>
              <div className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800">
                      v{activeVersion.version_number}
                    </span>
                    <span>TikTok · 9:16 · 00:28</span>
                  </div>
                  <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900">
                    {u.switchVersion}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div ref={stageRef} className="relative cursor-crosshair bg-zinc-950" onClick={handleStageClick}>
                  <video
                    ref={videoRef}
                    key={activeVersion.file_url}
                    src={activeVersion.file_url}
                    className="aspect-video w-full object-contain"
                    onTimeUpdate={() => setCurrentSec(videoRef.current?.currentTime ?? 0)}
                    onLoadedMetadata={() => setDurationSec(videoRef.current?.duration ?? 28)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {demo.timeline.map((marker, index) => {
                    const pin = demo.pinPositions[index] ?? { x: 30, y: 40 };
                    return (
                      <button
                        key={marker.id}
                        type="button"
                        data-pin-control
                        className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white shadow-md ring-2 ring-white"
                        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          seekTo(marker.seconds);
                        }}
                      >
                        {marker.index}
                      </button>
                    );
                  })}

                  {pinDraft ? (
                    <div
                      data-pin-control
                      className="absolute z-20 w-52 -translate-x-1/2 -translate-y-full rounded-xl border border-zinc-200 bg-white p-3 shadow-xl"
                      style={{ left: `${pinDraft.x}%`, top: `${pinDraft.y}%` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-xs text-zinc-400">{formatTime(pinDraft.seconds)}</span>
                        <button type="button" onClick={() => setPinDraft(null)} className="text-zinc-400 hover:text-zinc-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        value={pinText}
                        onChange={(e) => setPinText(e.target.value)}
                        placeholder={u.commentHere}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                        autoFocus
                      />
                      <Button type="button" size="sm" className="mt-2 h-8 w-full rounded-lg bg-zinc-900" disabled={isPending || !pinText.trim()} onClick={savePinComment}>
                        {u.save}
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-zinc-100 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-3">
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200" onClick={togglePlay}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="relative h-1 w-full rounded-full bg-zinc-200"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          seekTo(Math.max(0, Math.min(durationSec, ((e.clientX - rect.left) / rect.width) * durationSec)));
                        }}
                      >
                        <span className="absolute inset-y-0 left-0 rounded-full bg-zinc-900" style={{ width: `${progress}%` }} />
                        {demo.timeline.map((m) => (
                          <span
                            key={m.id}
                            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 ring-2 ring-white"
                            style={{ left: `${(m.seconds / durationSec) * 100}%` }}
                          />
                        ))}
                      </button>
                      <div className="mt-1 flex justify-between font-mono text-[11px] text-zinc-400">
                        <span>{formatTime(currentSec)}</span>
                        <span>{formatTime(durationSec)}</span>
                      </div>
                    </div>
                    <span className="hidden text-xs text-zinc-400 sm:inline">1.0x</span>
                    <Volume2 className="hidden h-4 w-4 text-zinc-400 sm:block" />
                    <Settings className="hidden h-4 w-4 text-zinc-400 sm:block" />
                    <Maximize2 className="hidden h-4 w-4 text-zinc-400 sm:block" />
                  </div>
                </div>
              </div>

              {/* Timeline ruler + cards */}
              <div className="rounded-[20px] border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="relative h-8 flex-1 rounded-lg bg-zinc-50">
                    {demo.timeline.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 ring-2 ring-white"
                        style={{ left: `${(m.seconds / durationSec) * 100}%` }}
                        onClick={() => seekTo(m.seconds)}
                      />
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="ml-3 shrink-0 rounded-lg border-zinc-200 text-xs">
                    {u.addMarker}
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {demo.timeline.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      onClick={() => seekTo(marker.seconds)}
                      className="rounded-xl border border-zinc-100 p-3 text-left transition hover:border-zinc-200 hover:bg-zinc-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                          {marker.index}
                        </span>
                        <span className="font-mono text-xs text-zinc-400">{formatTime(marker.seconds)}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-zinc-900">{marker.category}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{marker.detail}</p>
                      <span
                        className={cn(
                          "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                          marker.status === "pass" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}
                      >
                        {marker.status === "pass" ? u.pass : u.suggestRevision}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500">{t.noVideo}</p>
          )}

          {/* Bottom tabbed panel */}
          <div className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex overflow-x-auto border-b border-zinc-100">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBottomTab(tab.id)}
                  className={cn(
                    "shrink-0 px-4 py-3 text-sm font-medium transition",
                    bottomTab === tab.id
                      ? "border-b-2 border-zinc-900 text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  {tab.label}
                  {tab.count != null ? ` (${tab.count})` : ""}
                </button>
              ))}
            </div>

            <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
              {bottomTab === "versions" || bottomTab === "comments" ? (
                <div className="border-b border-zinc-100 p-4 lg:border-b-0 lg:border-r">
                  <ul className="space-y-2">
                    {demo.versionRows.map((row) => (
                      <li key={row.version}>
                        <button
                          type="button"
                          onClick={() => {
                            const match = versions.find((v) => v.version_number === row.version);
                            if (match) setActiveVersionId(match.id);
                          }}
                          className={cn(
                            "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition",
                            row.version === activeVersion?.version_number
                              ? "border-zinc-900 bg-zinc-50"
                              : "border-zinc-100 hover:bg-zinc-50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-900">
                              v{row.version}
                              {row.label === "当前" || row.label === "Current" ? ` · ${row.label}` : ""}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                row.status === "rejected"
                                  ? "bg-zinc-100 text-zinc-600"
                                  : "bg-amber-50 text-amber-700"
                              )}
                            >
                              {versionStatusLabel(row.status, locale)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-400">{row.time}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {canUpload ? (
                    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-3 text-xs text-zinc-600 hover:bg-zinc-50">
                      <Upload className="h-3.5 w-3.5" />
                      {u.uploadNew}
                      <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
                    </label>
                  ) : null}
                </div>
              ) : null}

              <div className="p-4">
                {bottomTab === "comments" ? (
                  <div className="space-y-4">
                    {demo.chat.map((msg) => (
                      <div key={msg.id} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700">
                          {msg.author[0]}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            <span className="font-medium text-zinc-800">
                              {msg.author} ({msg.role})
                            </span>
                            <span>{msg.time}</span>
                            {msg.marker ? (
                              <button type="button" className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-700" onClick={() => seekTo(parseInt(msg.marker!.split(":")[1] ?? "0", 10))}>
                                {msg.marker}
                              </button>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-zinc-700">{msg.body}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                      <input
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        placeholder={u.commentPlaceholder}
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                      <button type="button" className="text-zinc-400 hover:text-zinc-700">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}

                {bottomTab === "suggestions" ? (
                  <div className="space-y-3">
                    <ul className="space-y-2">
                      {demo.suggestions.map((s) => (
                        <li key={s.id} className="rounded-xl border border-zinc-100 px-3 py-2.5 text-sm text-zinc-700">
                          {s.text}
                        </li>
                      ))}
                    </ul>
                    <Button type="button" variant="outline" className="rounded-lg border-zinc-200 text-sm">
                      {u.apply}
                    </Button>
                  </div>
                ) : null}

                {bottomTab === "deliverables" ? (
                  <ul className="space-y-2">
                    {demo.deliverables.map((file) => (
                      <li key={file.id} className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2.5 text-sm">
                        <span className="font-medium text-zinc-800">{file.name}</span>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <span className="text-xs">{file.size}</span>
                          <Download className="h-4 w-4" />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {bottomTab === "versions" ? (
                  <p className="text-sm text-zinc-500">{locale === "zh" ? "选择左侧版本切换播放器。" : "Select a version on the left to switch the player."}</p>
                ) : null}
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-[4.5rem] xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto">
          <div className="rounded-[20px] border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-900">{u.aiAssistant}</h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {demo.guidelines.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm">
                  {item.passed ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  )}
                  <span className="text-zinc-700">
                    {item.label}
                    {item.time ? <span className="ml-1 font-mono text-xs text-zinc-400">({item.time})</span> : null}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <p className="text-center text-xs font-medium uppercase tracking-wide text-zinc-400">{u.aiScore}</p>
              <ScoreRing score={demo.aiScore} />
              <ul className="mt-4 space-y-3">
                {demo.confidence.map((metric) => (
                  <li key={metric.label}>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>{metric.label}</span>
                      <span className="font-medium text-zinc-800">{metric.value}%</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-zinc-900" style={{ width: `${metric.value}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[20px] border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-zinc-900">{u.history}</h2>
            <ul className="mt-3 space-y-2">
              {demo.versionRows.map((row) => (
                <li key={row.version} className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 text-sm">
                  <span className="font-medium text-zinc-800">v{row.version}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      row.status === "rejected" ? "bg-zinc-100 text-zinc-600" : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {versionStatusLabel(row.status, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[20px] border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-zinc-900">{u.deliverables}</h2>
            <ul className="mt-3 space-y-2">
              {demo.deliverables.map((file) => (
                <li key={file.id} className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 text-sm">
                  <span className="truncate font-medium text-zinc-800">{file.name}</span>
                  <div className="flex shrink-0 items-center gap-2 text-zinc-400">
                    <span className="text-xs">{file.size}</span>
                    <Download className="h-4 w-4" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Bottom action bar */}
      {canApprove ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur lg:left-[248px]">
          <div className="mx-auto grid max-w-5xl gap-3 px-4 py-4 sm:grid-cols-3 sm:px-6">
            <form action={requestMvpRevisionAction}>
              <input type="hidden" name="project_id" value={project.id} />
              <button
                type="submit"
                className="flex w-full items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:bg-zinc-50"
              >
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">{u.needsRevision}</span>
                  <span className="block text-xs text-zinc-500">{u.needsRevisionSub}</span>
                </span>
              </button>
            </form>
            <form action={requestMvpRevisionAction}>
              <input type="hidden" name="project_id" value={project.id} />
              <button
                type="submit"
                className="flex w-full items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:bg-zinc-50"
              >
                <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">{u.requestChanges}</span>
                  <span className="block text-xs text-zinc-500">{u.requestChangesSub}</span>
                </span>
              </button>
            </form>
            <form action={approveFinalAction}>
              <input type="hidden" name="project_id" value={project.id} />
              <button
                type="submit"
                className="flex w-full items-start gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-left text-white transition hover:bg-zinc-800"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  <span className="block text-sm font-semibold">{u.approve}</span>
                  <span className="block text-xs text-zinc-400">{u.approveSub}</span>
                </span>
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
