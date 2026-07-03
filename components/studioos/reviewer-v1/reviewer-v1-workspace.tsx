"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addReviewCommentAction,
  updateReviewCommentStatusAction,
  uploadVideoVersionAction
} from "@/app/review-actions";
import { ReviewerV1Header } from "@/components/studioos/reviewer-v1/reviewer-v1-header";
import { ReviewerV1Toolbar } from "@/components/studioos/reviewer-v1/reviewer-v1-toolbar";
import { ReviewerV1PlayerStage } from "@/components/studioos/reviewer-v1/reviewer-v1-player-stage";
import { ReviewerV1Timeline } from "@/components/studioos/reviewer-v1/reviewer-v1-timeline";
import { ReviewerV1CommentsPanel } from "@/components/studioos/reviewer-v1/reviewer-v1-comments-panel";
import { ReviewerV1VersionDock } from "@/components/studioos/reviewer-v1/reviewer-v1-version-dock";
import { annotationFromComment, type ReviewerAnnotationShape, type ReviewerWorkspaceProps } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import { serializeAnnotations } from "@/components/studioos/reviewer-v1/reviewer-v1-serialize";
import { useReviewerPlayback } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import { useReviewerPlaybackKeyboard } from "@/components/studioos/reviewer-skeleton/use-reviewer-playback-keyboard";
import { readVideoCommentTimestampSec } from "@/lib/studioos/review-comment-time";
import { reviewSameAnnotationFrame } from "@/lib/studioos/reviewer-annotation-ui";

export function ReviewerV1Workspace({
  locale,
  order,
  campaignTitle,
  deliverables,
  initialComments,
  initialVersion,
  role,
  backHref,
  backLabel,
  actionError,
  decisionSlot
}: ReviewerWorkspaceProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState(initialComments);
  const [deliverablesState, setDeliverablesState] = useState(deliverables);
  const [activeVersion, setActiveVersion] = useState(
    initialVersion || deliverables[deliverables.length - 1]?.version || 1
  );
  const [activeTool, setActiveTool] = useState<"select" | "pen" | "arrow" | "rect" | "circle" | "text" | "delete">("select");
  const [penColor, setPenColor] = useState("#FF4D4F");
  const [penSize, setPenSize] = useState(2);
  const [pendingAnnotations, setPendingAnnotations] = useState<ReviewerAnnotationShape[]>([]);
  const [draftFrameSec, setDraftFrameSec] = useState<number | null>(null);
  const draftFrameSecRef = useRef<number | null>(null);
  const commitDraftRef = useRef<() => void>(() => {});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [uploadNotes, setUploadNotes] = useState("");
  const [error, setError] = useState<string | null>(actionError ?? null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    setDeliverablesState(deliverables);
  }, [deliverables]);

  const activeDeliverable =
    deliverablesState.find((item) => item.version === activeVersion) ??
    deliverablesState[deliverablesState.length - 1];
  const videoUrl = activeDeliverable?.file_url ?? "";

  const playback = useReviewerPlayback(videoRef, videoUrl, activeVersion);
  const {
    videoStatus,
    currentSec,
    durationSec,
    isPlaying,
    playbackRate,
    volume,
    setPlaybackRate,
    setVolume,
    handleLoadedMetadata,
    handleLoadedData,
    handleError,
    handlePlay,
    handlePause,
    handleEnded,
    handleTimeUpdate,
    handlePlayPause,
    seekTo,
    pauseAt
  } = playback;

  useReviewerPlaybackKeyboard(
    handlePlayPause,
    Boolean(videoUrl) && videoStatus !== "error" && videoStatus !== "missing"
  );

  const isBrandPaused = role === "brand" && !isPlaying;
  const canComment = isBrandPaused;
  const canDraw = isBrandPaused && videoStatus === "ready";

  const versionComments = useMemo(
    () =>
      [...comments]
        .filter((item) => item.version === activeVersion)
        .sort((a, b) => a.timestamp_sec - b.timestamp_sec),
    [comments, activeVersion]
  );

  const visibleAnnotations = useMemo(() => {
    const source = activeCommentId
      ? versionComments.filter((item) => item.id === activeCommentId)
      : versionComments.filter((item) => reviewSameAnnotationFrame(item.timestamp_sec, currentSec));
    return source.flatMap((item) => annotationFromComment(item));
  }, [versionComments, activeCommentId, currentSec]);

  const visiblePendingAnnotations = useMemo(() => {
    if (!pendingAnnotations.length || draftFrameSec === null) return [];
    return reviewSameAnnotationFrame(currentSec, draftFrameSec) ? pendingAnnotations : [];
  }, [pendingAnnotations, draftFrameSec, currentSec]);

  const defaultAnnotationBody = locale === "zh" ? "画面批注" : "Frame annotation";

  const clearDraftSession = useCallback(() => {
    draftFrameSecRef.current = null;
    setDraftFrameSec(null);
    setPendingAnnotations([]);
  }, []);

  const submitComment = useCallback(
    (body: string, annotations: ReviewerAnnotationShape[] = [], timestampSec = currentSec) => {
      if (!body.trim()) return;
      startTransition(async () => {
        setError(null);
        const fd = new FormData();
        fd.set("lang", locale);
        fd.set("order_id", order.id);
        fd.set("version", String(activeVersion));
        fd.set("timestamp_sec", String(timestampSec));
        fd.set("body", body.trim());
        if (annotations.length) {
          fd.set("annotations_json", serializeAnnotations(annotations, timestampSec));
        }
        const result = await addReviewCommentAction(fd);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setComments((prev) => [...prev, result.comment]);
        setDraftBody("");
        clearDraftSession();
        setActiveCommentId(result.comment.id);
        router.refresh();
      });
    },
    [activeVersion, clearDraftSession, currentSec, locale, order.id, router]
  );

  const commitDraftAnnotations = useCallback(() => {
    if (!pendingAnnotations.length || draftFrameSecRef.current === null) return;
    const frameSec = draftFrameSecRef.current;
    const annotations = [...pendingAnnotations];
    clearDraftSession();
    submitComment(defaultAnnotationBody, annotations, frameSec);
  }, [clearDraftSession, defaultAnnotationBody, pendingAnnotations, submitComment]);

  commitDraftRef.current = commitDraftAnnotations;

  useEffect(() => {
    if (!pendingAnnotations.length || draftFrameSec === null) return;
    if (reviewSameAnnotationFrame(currentSec, draftFrameSec)) return;
    commitDraftRef.current();
  }, [currentSec, draftFrameSec, pendingAnnotations.length]);

  function handleCreateAnnotation(annotation: ReviewerAnnotationShape) {
    if (!canDraw) return;
    const frameSec = readVideoCommentTimestampSec(videoRef.current, currentSec);
    if (draftFrameSecRef.current === null) {
      draftFrameSecRef.current = frameSec;
      setDraftFrameSec(frameSec);
    }
    setPendingAnnotations((prev) => [...prev, annotation]);
  }

  function handleSelectComment(commentId: string) {
    const target = comments.find((item) => item.id === commentId);
    if (!target) return;
    setActiveCommentId(commentId);
    pauseAt(target.timestamp_sec);
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
      setUploadNotes("");
      if (fileRef.current) fileRef.current.value = "";
      setDeliverablesState((prev) => {
        if (prev.some((item) => item.version === result.deliverable.version)) {
          return prev;
        }
        return [...prev, result.deliverable].sort((a, b) => a.version - b.version);
      });
      setActiveVersion(result.deliverable.version);
      setActiveCommentId(null);
      setPendingAnnotations([]);
      router.refresh();
    });
  }

  return (
    <div className="min-h-svh bg-zinc-50">
      <ReviewerV1Header
        locale={locale}
        backHref={backHref}
        backLabel={backLabel}
        campaignTitle={campaignTitle}
        orderId={order.id}
        createdAt={order.created_at}
        decisionSlot={decisionSlot}
      />
      {error ? (
        <div className="mx-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 p-4 lg:p-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start">
          <div className="shrink-0 xl:sticky xl:top-6 xl:self-start">
            <ReviewerV1Toolbar
          locale={locale}
          activeTool={activeTool}
          canDraw={canDraw}
          penColor={penColor}
          penSize={penSize}
          onToolChange={(tool) => {
            if (tool === "delete") {
              setPendingAnnotations((prev) => {
                const next = prev.slice(0, -1);
                if (!next.length) {
                  draftFrameSecRef.current = null;
                  setDraftFrameSec(null);
                }
                return next;
              });
              return;
            }
            setActiveTool(tool);
          }}
          onUndo={() =>
            setPendingAnnotations((prev) => {
              const next = prev.slice(0, -1);
              if (!next.length) {
                draftFrameSecRef.current = null;
                setDraftFrameSec(null);
              }
              return next;
            })
          }
          onPenColorChange={setPenColor}
          onPenSizeChange={setPenSize}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
          <ReviewerV1PlayerStage
            locale={locale}
            role={role}
            playbackVersion={activeVersion}
            videoUrl={videoUrl}
            videoRef={videoRef}
            stageRef={stageRef}
            videoStatus={videoStatus}
            isPlaying={isPlaying}
            currentSec={currentSec}
            durationSec={durationSec}
            playbackRate={playbackRate}
            volume={volume}
            canDraw={canDraw}
            activeTool={activeTool}
            penColor={penColor}
            penSize={penSize}
            annotations={visibleAnnotations}
            pendingAnnotations={visiblePendingAnnotations}
            onPlayPause={handlePlayPause}
            onSeek={seekTo}
            onVolumeChange={(next) => {
              setVolume(next);
              if (videoRef.current) videoRef.current.volume = next;
            }}
            onPlaybackRateChange={(rate) => {
              setPlaybackRate(rate);
              if (videoRef.current) videoRef.current.playbackRate = rate;
            }}
            onToggleFullscreen={() => {
              const target = stageRef.current;
              if (!target) return;
              if (document.fullscreenElement) {
                void document.exitFullscreen();
              } else {
                void target.requestFullscreen();
              }
            }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onLoadedData={handleLoadedData}
            onError={handleError}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onCreateAnnotation={handleCreateAnnotation}
          />
          <ReviewerV1Timeline
            locale={locale}
            comments={versionComments}
            durationSec={durationSec}
            currentSec={currentSec}
            onSeek={(sec) => pauseAt(sec)}
          />
          <ReviewerV1VersionDock
            locale={locale}
            role={role}
            versions={[...deliverablesState].sort((a, b) => a.version - b.version)}
            activeVersion={activeVersion}
            uploadNotes={uploadNotes}
            uploadPending={pending}
            fileRef={fileRef}
            onSelectVersion={(version) => {
              if (version === activeVersion) return;
              setActiveVersion(version);
              setActiveCommentId(null);
              clearDraftSession();
              setDraftBody("");
            }}
            onUploadNotesChange={setUploadNotes}
            onUpload={handleUpload}
          />
          </div>
        </div>
        <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
        <ReviewerV1CommentsPanel
          locale={locale}
          role={role}
          comments={versionComments}
          currentFilter={filter}
          draftBody={draftBody}
          canComment={canComment}
          isPlaying={isPlaying}
          videoStatus={videoStatus}
          activeCommentId={activeCommentId}
          onFilterChange={setFilter}
          onDraftBodyChange={setDraftBody}
          onAddComment={() => {
            if (pendingAnnotations.length && draftFrameSecRef.current !== null) {
              const frameSec = draftFrameSecRef.current;
              const annotations = [...pendingAnnotations];
              const body = draftBody.trim() || defaultAnnotationBody;
              clearDraftSession();
              submitComment(body, annotations, frameSec);
              return;
            }
            submitComment(draftBody);
          }}
          onSelectComment={(comment) => handleSelectComment(comment.id)}
          onToggleStatus={(commentId, status) => {
            startTransition(async () => {
              const fd = new FormData();
              fd.set("lang", locale);
              fd.set("order_id", order.id);
              fd.set("comment_id", commentId);
              fd.set("status", status);
              const result = await updateReviewCommentStatusAction(fd);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setComments((prev) => prev.map((item) => (item.id === commentId ? result.comment : item)));
              router.refresh();
            });
          }}
        />
        </div>
      </div>
    </div>
  );
}
