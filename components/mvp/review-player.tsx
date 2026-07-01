"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addMvpCommentAction,
  approveFinalAction,
  releaseSettlementAction,
  requestMvpRevisionAction,
  uploadMvpVideoAction
} from "@/app/mvp-actions";
import type { Locale } from "@/lib/i18n";
import {
  canDownloadMaster,
  isPendingSettlement,
  isReviewPhase,
  isSettled,
  projectStatusLabel,
  reviewIsLocked
} from "@/lib/mvp/review-settlement";
import type { MvpProfile, MvpRole, ReviewProject, VideoComment, VideoVersion } from "@/lib/mvp/types";
import { ReviewVideoSource } from "@/components/mvp/review-video-source";
import { ReviewWatermarkOverlay } from "@/components/mvp/review-watermark-overlay";
import { wsCopy } from "@/lib/mvp/workspace-copy";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Circle,
  Clock,
  Download,
  Link2,
  Lock,
  Maximize2,
  MousePointer2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Smile,
  Square,
  Trash2,
  Type,
  Undo2,
  UploadCloud,
  Volume2
} from "lucide-react";

type Tool = "select" | "circle" | "pencil" | "rect" | "arrow" | "text";

type CircleDraft = { x: number; y: number; width: number; height: number };
type PencilDraft = { points: { x: number; y: number }[] };

const MARKER_COLORS = ["#F59E0B", "#7C3AED", "#3B82F6"];
const NEAR_SEC = 0.35;

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function formatTimecode(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatRuler(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function normalizeRect(a: { x: number; y: number }, b: { x: number; y: number }): CircleDraft {
  const x1 = clamp01(Math.min(a.x, b.x));
  const y1 = clamp01(Math.min(a.y, b.y));
  const x2 = clamp01(Math.max(a.x, b.x));
  const y2 = clamp01(Math.max(a.y, b.y));
  return { x: x1, y: y1, width: Math.max(x2 - x1, 0.02), height: Math.max(y2 - y1, 0.02) };
}

function pencilBounds(points: { x: number; y: number }[]): CircleDraft | null {
  if (points.length < 2) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x1 = clamp01(Math.min(...xs));
  const y1 = clamp01(Math.min(...ys));
  const x2 = clamp01(Math.max(...xs));
  const y2 = clamp01(Math.max(...ys));
  return { x: x1, y: y1, width: Math.max(x2 - x1, 0.02), height: Math.max(y2 - y1, 0.02) };
}

function toEllipse(rect: CircleDraft) {
  return {
    cx: rect.x + rect.width / 2,
    cy: rect.y + rect.height / 2,
    rx: rect.width / 2,
    ry: rect.height / 2
  };
}

function markerColor(index: number, comment?: VideoComment) {
  return comment?.color ?? MARKER_COLORS[index % MARKER_COLORS.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ReviewPlayer({
  locale = "zh",
  project,
  versions,
  comments: serverComments,
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
  flash?: "approved" | "revision" | "settled";
}) {
  const zh = locale === "zh";
  const t = wsCopy("review", locale);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const [activeVersionId, setActiveVersionId] = useState(versions[versions.length - 1]?.id ?? "");
  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[versions.length - 1];

  const versionComments = useMemo(
    () =>
      serverComments
        .filter((c) => c.video_version_id === activeVersion?.id)
        .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds),
    [serverComments, activeVersion?.id]
  );

  const [tool, setTool] = useState<Tool>("circle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [circleDraft, setCircleDraft] = useState<CircleDraft | null>(null);
  const [pencilDraft, setPencilDraft] = useState<PencilDraft | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"video" | "comments">("video");

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setSelectedId(null);
    setCircleDraft(null);
    setPencilDraft(null);
    setDragStart(null);
  }, [activeVersionId]);

  function syncDurationFromVideo() {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration;
    if (Number.isFinite(d) && d > 0) setDuration(d);
  }

  const reviewStatus = projectStatusLabel(project.status, locale);
  const canEdit = role === "brand" && isReviewPhase(project.status);
  const canDecide = canEdit;
  const canUpload = role === "studio" && !reviewIsLocked(project.status);
  const pendingSettlement = isPendingSettlement(project.status);
  const settled = isSettled(project.status);
  const masterReady = canDownloadMaster(project);

  const openCount = versionComments.filter((c) => c.status === "open" || c.status === "reopened").length;
  const resolvedCount = versionComments.filter((c) => c.status === "resolved").length;

  const pointerToNorm = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height)
    };
  }, []);

  function pauseVideo() {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setPaused(true);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => undefined);
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  }

  function seek(ratio: number) {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = ratio * duration;
    setCurrentTime(v.currentTime);
  }

  function jumpTo(time: number, id: string) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = time;
    v.pause();
    setPaused(true);
    setCurrentTime(time);
    setSelectedId(id);
  }

  function commentVisible(c: VideoComment) {
    return selectedId === c.id || Math.abs(c.timestamp_seconds - currentTime) < NEAR_SEC;
  }

  function onSvgDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!canEdit || !paused) return;
    if (tool !== "circle" && tool !== "pencil" && tool !== "rect") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = pointerToNorm(e.clientX, e.clientY);
    setDragStart(pt);
    if (tool === "circle" || tool === "rect") {
      setCircleDraft({ x: pt.x, y: pt.y, width: 0, height: 0 });
      setPencilDraft(null);
    } else if (tool === "pencil") {
      setPencilDraft({ points: [pt] });
      setCircleDraft(null);
    }
  }

  function onSvgMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragStart) return;
    const pt = pointerToNorm(e.clientX, e.clientY);
    if (tool === "circle" || tool === "rect") {
      setCircleDraft(normalizeRect(dragStart, pt));
    } else if (tool === "pencil") {
      setPencilDraft((prev) => ({ points: [...(prev?.points ?? []), pt] }));
    }
  }

  function onSvgUp(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragStart) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragStart(null);
  }

  function clearDraft() {
    setCircleDraft(null);
    setPencilDraft(null);
    setDragStart(null);
  }

  function publish() {
    if (!canEdit || !draft.trim() || !activeVersion) return;
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    const timeSeconds = v.currentTime;
    let annotation: { type: "circle" | "rect"; x: number; y: number; width: number; height: number; color: string } | null =
      null;

    if (circleDraft && circleDraft.width > 0.02 && circleDraft.height > 0.02) {
      annotation = {
        type: tool === "rect" ? "rect" : "circle",
        ...circleDraft,
        color: MARKER_COLORS[versionComments.length % MARKER_COLORS.length]!
      };
    } else if (pencilDraft && pencilDraft.points.length > 1) {
      const box = pencilBounds(pencilDraft.points);
      if (box) {
        annotation = { type: "rect", ...box, color: MARKER_COLORS[versionComments.length % MARKER_COLORS.length]! };
      }
    }

    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("project_id", project.id);
      fd.set("video_version_id", activeVersion.id);
      fd.set("timestamp_seconds", String(timeSeconds));
      fd.set("comment_text", draft.trim());
      if (annotation) {
        fd.set("annotation_type", annotation.type);
        fd.set("pos_x", String(annotation.x));
        fd.set("pos_y", String(annotation.y));
        fd.set("width", String(annotation.width));
        fd.set("height", String(annotation.height));
        fd.set("color", annotation.color);
      }
      const result = await addMvpCommentAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft("");
      clearDraft();
      router.refresh();
    });
  }

  function handleUpload() {
    const file = uploadRef.current?.files?.[0];
    if (!file || !canUpload) return;

    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("project_id", project.id);
      fd.set("video_file", file);
      const result = await uploadMvpVideoAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (uploadRef.current) uploadRef.current.value = "";
      router.refresh();
    });
  }

  const toolbarItems: { id: Tool; icon: typeof MousePointer2; label: string; enabled: boolean }[] = [
    { id: "select", icon: MousePointer2, label: zh ? "选择" : "Select", enabled: true },
    { id: "circle", icon: Circle, label: zh ? "画圈" : "Circle", enabled: true },
    { id: "pencil", icon: Pencil, label: zh ? "铅笔" : "Pencil", enabled: true },
    { id: "rect", icon: Square, label: zh ? "矩形" : "Rect", enabled: true },
    { id: "arrow", icon: ArrowUpRight, label: zh ? "箭头" : "Arrow", enabled: false },
    { id: "text", icon: Type, label: zh ? "文字" : "Text", enabled: false }
  ];

  const rulerTicks = useMemo(() => {
    if (!duration) return [];
    const step = duration > 120 ? 10 : 5;
    const ticks: number[] = [];
    for (let s = 0; s <= duration; s += step) ticks.push(s);
    return ticks;
  }, [duration]);

  function switchVersion(versionId: string) {
    setActiveVersionId(versionId);
    setSelectedId(null);
    clearDraft();
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-zinc-900">
      {/* Top bar — project / version / status */}
      <header className="shrink-0 border-b border-zinc-200/80 bg-white px-3 py-2.5 sm:px-5 lg:h-14 lg:py-0">
        <div className="flex flex-col gap-2 lg:h-full lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="truncate text-sm font-semibold text-zinc-900">{project.title}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:text-xs",
                isReviewPhase(project.status)
                  ? "bg-violet-100 text-violet-700"
                  : pendingSettlement
                    ? "bg-amber-100 text-amber-800"
                    : settled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-100 text-zinc-600"
              )}
            >
              {reviewStatus}
            </span>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2 lg:justify-end">
            {versions.length > 0 ? (
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 lg:flex-none lg:gap-2">
                <span className="hidden shrink-0 text-xs font-medium text-zinc-500 sm:inline">
                  {zh ? "当前版本" : "Version"}
                </span>
                <div className="flex shrink-0 items-center gap-1 rounded-xl bg-zinc-100 p-0.5 ring-1 ring-zinc-200/80 sm:p-1">
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => switchVersion(v.id)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-semibold transition sm:px-3 sm:py-1.5 sm:text-sm",
                        v.id === activeVersionId
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "text-zinc-600 hover:bg-white hover:text-zinc-900"
                      )}
                    >
                      {zh ? `版本 ${v.version_number}` : `V${v.version_number}`}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 sm:gap-2 sm:px-3 sm:text-sm"
            >
              <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{zh ? "分享审片链接" : "Share link"}</span>
            </button>
          </div>
        </div>
      </header>

      {flash === "approved" ? (
        <div className="shrink-0 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 sm:px-4 sm:text-sm">
          {t.pendingSettlementFlash}
        </div>
      ) : null}
      {flash === "revision" ? (
        <div className="shrink-0 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 sm:px-4 sm:text-sm">
          {t.revisionFlash}
        </div>
      ) : null}

      {/* Mobile tab switcher */}
      <div className="flex shrink-0 border-b border-zinc-200 bg-zinc-50/80 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("video")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition",
            mobileTab === "video"
              ? "border-b-2 border-violet-600 text-violet-700"
              : "text-zinc-500 hover:text-zinc-800"
          )}
        >
          {zh ? "视频" : "Video"}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("comments")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition",
            mobileTab === "comments"
              ? "border-b-2 border-violet-600 text-violet-700"
              : "text-zinc-500 hover:text-zinc-800"
          )}
        >
          {zh ? "评论" : "Comments"} ({versionComments.length})
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Main — player + toolbar + timeline + cards + footer */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col bg-white",
            mobileTab !== "video" && "hidden lg:flex"
          )}
        >
          {/* Video — strict 16:9 */}
          <div className="relative shrink-0 bg-black">
            <div className="relative aspect-[16/9] w-full">
              {activeVersion ? (
                <>
                  <ReviewVideoSource
                    videoRef={videoRef}
                    hlsUrl={activeVersion.hls_url ?? null}
                    fileUrl={activeVersion.file_url ?? null}
                    className="absolute inset-0 h-full w-full object-contain"
                    onTimeUpdate={setCurrentTime}
                    onLoadedMetadata={syncDurationFromVideo}
                    onDurationChange={syncDurationFromVideo}
                    onLoadedData={syncDurationFromVideo}
                    onPlay={() => setPaused(false)}
                    onPause={() => setPaused(true)}
                    onClick={togglePlay}
                  />
                  <ReviewWatermarkOverlay
                    label={project.brand_name}
                    sublabel={profiles[project.created_by]?.email}
                    enabled={!canDownloadMaster(project)}
                  />

                  <svg
                    ref={svgRef}
                    className={cn(
                      "absolute inset-0 h-full w-full touch-none",
                      canEdit && paused && tool !== "select" && tool !== "arrow" && tool !== "text"
                        ? "cursor-crosshair"
                        : "pointer-events-none"
                    )}
                    viewBox="0 0 1 1"
                    preserveAspectRatio="none"
                    onPointerDown={onSvgDown}
                    onPointerMove={onSvgMove}
                    onPointerUp={onSvgUp}
                  >
                    {versionComments.map((c, i) => {
                      if (!commentVisible(c)) return null;
                      if (c.pos_x == null || c.pos_y == null || c.width == null || c.height == null) return null;
                      const rect: CircleDraft = { x: c.pos_x, y: c.pos_y, width: c.width, height: c.height };
                      const { cx, cy, rx, ry } = toEllipse(rect);
                      const color = markerColor(i, c);
                      const isCircle = c.annotation_type !== "rect";
                      return (
                        <g key={c.id}>
                          {isCircle ? (
                            <ellipse
                              cx={cx}
                              cy={cy}
                              rx={rx}
                              ry={ry}
                              fill="none"
                              stroke={color}
                              strokeWidth={0.005}
                              vectorEffect="non-scaling-stroke"
                            />
                          ) : (
                            <rect
                              x={rect.x}
                              y={rect.y}
                              width={rect.width}
                              height={rect.height}
                              fill="none"
                              stroke={color}
                              strokeWidth={0.005}
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                          <circle cx={rect.x + 0.02} cy={rect.y + 0.02} r={0.018} fill={color} />
                          <text
                            x={rect.x + 0.02}
                            y={rect.y + 0.02}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize={0.022}
                            fontWeight="700"
                          >
                            {i + 1}
                          </text>
                        </g>
                      );
                    })}

                    {circleDraft && circleDraft.width > 0 && circleDraft.height > 0 ? (
                      <ellipse
                        {...toEllipse(circleDraft)}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth={0.005}
                        strokeDasharray="0.01 0.008"
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null}

                    {pencilDraft && pencilDraft.points.length > 1 ? (
                      <polyline
                        points={pencilDraft.points.map((p) => `${p.x},${p.y}`).join(" ")}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth={0.004}
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null}
                  </svg>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-6 sm:px-4 sm:pb-3 sm:pt-8">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button type="button" onClick={togglePlay} className="text-white hover:text-violet-200">
                        {paused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5" />}
                      </button>
                      <span className="shrink-0 font-mono text-[10px] text-white/90 sm:text-xs">
                        {formatTimecode(currentTime)} / {formatTimecode(duration)}
                      </span>
                      <div
                        className="relative h-1.5 min-w-0 flex-1 cursor-pointer rounded-full bg-white/25"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          seek((e.clientX - rect.left) / rect.width);
                        }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-violet-500"
                          style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
                        />
                        {duration > 0
                          ? versionComments.map((c, i) => (
                              <button
                                key={c.id}
                                type="button"
                                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/20"
                                style={{
                                  left: `${(c.timestamp_seconds / duration) * 100}%`,
                                  backgroundColor: markerColor(i, c)
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  jumpTo(c.timestamp_seconds, c.id);
                                }}
                              />
                            ))
                          : null}
                        <div
                          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow"
                          style={{ left: duration ? `calc(${(currentTime / duration) * 100}% - 6px)` : "0" }}
                        />
                      </div>
                      <Volume2 className="hidden h-4 w-4 shrink-0 text-white/70 sm:block" />
                      <Maximize2 className="hidden h-4 w-4 shrink-0 text-white/70 sm:block" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex aspect-video items-center justify-center text-zinc-500">{zh ? "暂无视频" : "No video"}</div>
              )}
            </div>
          </div>

          {/* Annotation toolbar */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 py-2 sm:px-5">
            <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
              {toolbarItems.map(({ id, icon: Icon, label, enabled }) => (
                <button
                  key={id}
                  type="button"
                  disabled={!enabled}
                  title={label}
                  onClick={() => enabled && setTool(id)}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",
                    !enabled && "cursor-not-allowed opacity-30",
                    tool === id && enabled
                      ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
              <span className="mx-1 hidden h-5 w-px shrink-0 bg-zinc-200 sm:block" />
              <button
                type="button"
                onClick={clearDraft}
                title={zh ? "撤销" : "Undo"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={clearDraft}
                title={zh ? "删除" : "Delete"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="hidden shrink-0 text-xs text-zinc-400 md:block">
              {zh ? "提示：暂停视频后进行标注" : "Tip: pause the video before annotating"}
            </p>
          </div>

          {/* Timeline + horizontal cards — desktop only */}
          <div className="hidden min-h-0 flex-1 overflow-y-auto px-5 py-4 lg:block">
            <div className="relative mb-4 h-10 rounded-lg bg-zinc-50">
              {rulerTicks.map((tick) => (
                <span
                  key={tick}
                  className="absolute top-1 -translate-x-1/2 font-mono text-[10px] text-zinc-400"
                  style={{ left: duration ? `${(tick / duration) * 100}%` : "0%" }}
                >
                  {formatRuler(tick)}
                </span>
              ))}
              <div
                className="absolute bottom-0 top-4 w-0.5 bg-violet-500"
                style={{ left: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
              />
              {versionComments.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => jumpTo(c.timestamp_seconds, c.id)}
                  className="absolute top-6 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
                  style={{
                    left: duration ? `${(c.timestamp_seconds / duration) * 100}%` : "0%",
                    backgroundColor: markerColor(i, c)
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {versionComments.map((c, i) => {
                const author = profiles[c.user_id];
                const active = selectedId === c.id;
                const color = markerColor(i, c);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => jumpTo(c.timestamp_seconds, c.id)}
                    className={cn(
                      "min-w-[200px] shrink-0 rounded-xl border p-3 text-left transition",
                      active
                        ? "border-amber-300 bg-amber-50/60 ring-1 ring-amber-200"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {i + 1}
                      </span>
                      <span className="font-mono text-xs text-zinc-500">{formatTimecode(c.timestamp_seconds)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-800">{c.comment_text}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">
                        {initials(author?.name ?? "?")}
                      </span>
                      <span className="text-xs text-zinc-500">{author?.name ?? "—"}</span>
                    </div>
                  </button>
                );
              })}
              {canEdit ? (
                <div className="flex min-w-[120px] shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-6 text-sm text-zinc-400">
                  <span className="text-lg">+</span>
                  <span>{zh ? "当前评论" : "New comment"}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Bottom status bar — desktop left column */}
          <div className="hidden shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-t border-zinc-200 bg-white px-5 py-2.5 text-xs text-zinc-600 lg:flex">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isReviewPhase(project.status)
                    ? "bg-violet-500"
                    : pendingSettlement
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                )}
              />
              {reviewStatus}
            </span>
            <span>
              {versionComments.length} {zh ? "条评论" : "comments"}
            </span>
            <span>
              {openCount} {zh ? "待修改" : "open"}
            </span>
            <span>
              {resolvedCount} {zh ? "已解决" : "resolved"}
            </span>
          </div>
        </div>

        {/* Right panel — comments + actions */}
        <aside
          className={cn(
            "flex min-h-0 w-full shrink-0 flex-col border-zinc-200 bg-white lg:w-[360px] lg:border-l",
            mobileTab !== "comments" && "hidden lg:flex",
            mobileTab === "comments" && "flex-1"
          )}
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2.5 sm:px-4 sm:py-3">
            <h2 className="text-sm font-semibold text-zinc-900">
              {zh ? "评论" : "Comments"} {versionComments.length}
            </h2>
            <button type="button" className="text-xs text-zinc-500 hover:text-zinc-700">
              {zh ? "按时间" : "By time"}
            </button>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {versionComments.map((c, i) => {
              const author = profiles[c.user_id];
              const active = selectedId === c.id;
              const color = markerColor(i, c);
              return (
                <li key={c.id} className="border-b border-zinc-50">
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 transition",
                      active && "border-l-[3px] border-l-amber-400 bg-amber-50/40 pl-[13px]"
                    )}
                  >
                    <button type="button" onClick={() => jumpTo(c.timestamp_seconds, c.id)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {i + 1}
                        </span>
                        <span className="font-mono text-xs text-zinc-500">{formatTimecode(c.timestamp_seconds)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-800">{c.comment_text}</p>
                      <p className="mt-1 text-xs text-zinc-400">{author?.name ?? "—"}</p>
                    </button>
                    <button type="button" className="shrink-0 text-zinc-400 hover:text-zinc-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="shrink-0 space-y-3 border-t border-zinc-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
            {canEdit ? (
              <>
                <div className="relative rounded-xl border border-zinc-200 bg-zinc-50/50">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onFocus={pauseVideo}
                    rows={3}
                    placeholder={zh ? "写下你的评论..." : "Write a comment..."}
                    className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none"
                  />
                  <div className="flex items-center justify-between border-t border-zinc-100 px-2 py-1.5">
                    <button type="button" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
                      <Smile className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pending || !draft.trim()}
                      onClick={publish}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      {zh ? "发送" : "Send"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  {zh ? "当前时间：" : "At "}
                  <span className="font-mono">{formatTimecode(currentTime)}</span>
                  {paused ? (zh ? " (已暂停)" : " (paused)") : ""}
                </p>

                {canDecide ? (
                  <div className="grid grid-cols-2 gap-2">
                    <form action={requestMvpRevisionAction}>
                      <input type="hidden" name="project_id" value={project.id} />
                      <button
                        type="submit"
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                      >
                        {zh ? "需要修改" : "Needs revision"}
                      </button>
                    </form>
                    <form action={approveFinalAction}>
                      <input type="hidden" name="project_id" value={project.id} />
                      <button
                        type="submit"
                        className="h-10 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700"
                      >
                        {zh ? "通过审片" : "Approve"}
                      </button>
                    </form>
                  </div>
                ) : null}
              </>
            ) : pendingSettlement ? (
              <div className="flex items-start gap-3 rounded-xl bg-violet-50 px-4 py-3 ring-1 ring-violet-100">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-violet-900">{zh ? "已通过审片，等待结算" : "Approved — waiting for settlement"}</p>
                  <p className="mt-0.5 text-xs text-violet-700/80">
                    {zh ? "结算完成后可下载最终母版" : "Master download unlocks after settlement"}
                  </p>
                </div>
                <Lock className="h-4 w-4 shrink-0 text-violet-400" />
              </div>
            ) : settled && masterReady && project.master_file_url ? (
              role === "studio" ? null : (
                <a
                  href={project.master_file_url}
                  download={project.master_file_name ?? true}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white"
                >
                  <Download className="h-4 w-4" />
                  {zh ? "下载母版" : "Download master"}
                </a>
              )
            ) : canUpload ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-600">
                  {project.status === "revision"
                    ? zh
                      ? "品牌已提修改意见，请上传新版本"
                      : "Brand requested changes — upload a new version"
                    : zh
                      ? "上传审片版"
                      : "Upload review version"}
                </p>
                <input
                  ref={uploadRef}
                  type="file"
                  accept="video/mp4,.mp4"
                  className="block w-full text-xs text-zinc-500 file:mr-2 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleUpload}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  <UploadCloud className="h-4 w-4" />
                  {zh ? "上传新版本" : "Upload new version"}
                </button>
              </div>
            ) : null}

            {role === "admin" && pendingSettlement ? (
              <form action={releaseSettlementAction}>
                <input type="hidden" name="project_id" value={project.id} />
                <button type="submit" className="h-10 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white">
                  {zh ? "确认结算" : "Confirm settlement"}
                </button>
              </form>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </aside>
      </div>

      {/* Mobile status bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-zinc-200 bg-white px-3 py-2 text-[11px] text-zinc-600 lg:hidden sm:gap-x-5 sm:px-5 sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2",
              isReviewPhase(project.status)
                ? "bg-violet-500"
                : pendingSettlement
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            )}
          />
          {reviewStatus}
        </span>
        <span>
          {versionComments.length} {zh ? "条评论" : "comments"}
        </span>
        <span>
          {openCount} {zh ? "待修改" : "open"}
        </span>
        <span>
          {resolvedCount} {zh ? "已解决" : "resolved"}
        </span>
      </div>
    </div>
  );
}
