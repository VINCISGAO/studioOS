"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ReviewCenterCommentPanel } from "@/components/studioos/review-engine/review-center-comment-panel";
import { ReviewCenterEmptyUpload } from "@/components/studioos/review-engine/review-center-empty-upload";
import { ReviewCenterPlayer, type PinDraft } from "@/components/studioos/review-engine/review-center-player";
import { ReviewCenterStepper } from "@/components/studioos/review-engine/review-center-stepper";
import { ReviewCenterVersionStrip } from "@/components/studioos/review-engine/review-center-version-strip";
import { ReviewDeliveryDecisionForms } from "@/components/studioos/review-engine/review-delivery-decision-forms";
import { ReviewDeliveryFinalPanel } from "@/components/studioos/review-engine/review-delivery-final-panel";
import type { CampaignDeliveryView } from "@/features/delivery/delivery.service";
import type { ReviewPortalUiState } from "@/features/review/review-portal-ui-state";
import { useReviewCenterActions } from "@/components/studioos/review-engine/use-review-center-actions";
import { ReviewSettlementReleasePanel } from "@/components/studioos/review-engine/review-settlement-release-panel";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable, StoredOrder } from "@/lib/order-types";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import { cn, formatDate } from "@/lib/utils";

const copy = {
  en: {
    back: "Back",
    approve: "Approve delivery",
    requestChanges: "Request changes",
    noVideo: "Waiting for the studio to upload the first version.",
    uploadVersion: "Upload new version",
    uploadFirst: "Upload Version 1",
    creatorPhaseHint: "Upload Version 1 here to start review. Upload every revision from this review center.",
    inReview: "In review",
    revision: "Revisions requested",
    completed: "Approved",
    projectId: "Order",
    created: "Created"
  },
  zh: {
    back: "返回",
    approve: "通过交付",
    requestChanges: "要求修改",
    noVideo: "等待创作者上传视频。",
    uploadVersion: "上传新版本",
    uploadFirst: "上传 Version 1",
    creatorPhaseHint: "第一版从这里上传进入审片；之后的每一版也在审片中心提交。",
    inReview: "审片中",
    revision: "修改中",
    completed: "已通过",
    projectId: "订单",
    created: "创建时间"
  }
};

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
  backLabel,
  variant = "fullscreen",
  flash,
  actionError,
  delivery,
  reviewUi
}: {
  locale: Locale;
  order: StoredOrder;
  campaignTitle: string;
  deliverables: StoredDeliverable[];
  initialComments: ReviewComment[];
  initialVersion: number;
  role: "brand" | "creator";
  backHref: string;
  backLabel?: string;
  variant?: "fullscreen" | "embedded";
  flash?: "completed" | "revision";
  actionError?: string;
  delivery?: CampaignDeliveryView | null;
  reviewUi?: ReviewPortalUiState | null;
}) {
  const t = copy[locale];
  const embedded = variant === "embedded";
  const resolvedBackLabel = backLabel ?? t.back;
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState(initialComments);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
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
  const activeDeliverable =
    sortedVersions.find((item) => item.version === activeVersion) ??
    sortedVersions[sortedVersions.length - 1];
  const videoUrl = activeDeliverable?.file_url ?? "";
  const derivedStatus = reviewUi?.derivedOrderStatus ?? order.status;
  const canBrandReview =
    reviewUi?.canBrandReview ??
    (role === "brand" && ["review", "revision"].includes(order.status));
  const canCreatorUpload =
    reviewUi?.canCreatorUpload ??
    (role === "creator" && ["in_production", "revision", "review"].includes(order.status));
  const orderApproved = reviewUi?.orderApproved ?? order.status === "completed";

  const versionComments = useMemo(
    () => comments.filter((item) => item.version === activeVersion),
    [comments, activeVersion]
  );
  const canAnnotate = role === "brand" && canBrandReview && !isPlaying;

  const { pending, savePinComment, uploadVersion } = useReviewCenterActions({
    locale,
    orderId: order.id,
    activeVersion,
    onCommentsChange: (updater) => setComments(updater),
    onError: setError,
    onUploadComplete: () => {
      if (fileRef.current) fileRef.current.value = "";
      setUploadNotes("");
    },
    onPinClear: () => {
      setPinDraft(null);
      setPinText("");
    }
  });

  function handleStageClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!canAnnotate || pinDraft) return;
    if ((event.target as HTMLElement).closest("[data-pin-control]")) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPinDraft({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      seconds: currentSec
    });
    setPinText("");
  }

  function handleSelectComment(comment: ReviewComment) {
    const video = videoRef.current;
    if (video) {
      video.currentTime = comment.timestamp_sec;
      video.pause();
    }
    setCurrentSec(comment.timestamp_sec);
    setIsPlaying(false);
    setActiveCommentId(comment.id);
    setPinDraft(null);
    setPinText("");
  }

  function handleTogglePlay() {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    if (video.paused) {
      void video.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  }

  function handleSeek(sec: number) {
    const video = videoRef.current;
    if (video) video.currentTime = sec;
    setCurrentSec(sec);
  }

  function handlePickFile() {
    fileRef.current?.click();
  }

  function handleUpload(file?: File) {
    const selected = file ?? fileRef.current?.files?.[0];
    if (!selected) return;
    uploadVersion(selected, uploadNotes);
  }

  const isFirstUpload = sortedVersions.length === 0;
  const uploadLabel = isFirstUpload ? t.uploadFirst : t.uploadVersion;

  return (
    <div
      className={cn(
        "flex flex-col text-zinc-900",
        embedded ? "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm" : "min-h-svh bg-zinc-50"
      )}
    >
      <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {resolvedBackLabel}
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950">{campaignTitle}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span>
                {t.projectId}: {order.id}
              </span>
              <span>
                {t.created}: {formatDate(order.created_at)}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-medium",
                  orderApproved
                    ? "bg-emerald-50 text-emerald-700"
                    : derivedStatus === "revision"
                      ? "bg-amber-50 text-amber-800"
                      : "bg-[#5B5CFF]/10 text-[#5B5CFF]"
                )}
              >
                {orderStatusLabel(derivedStatus, locale)}
              </span>
            </div>
          </div>
          {role === "brand" && canBrandReview ? (
            <ReviewDeliveryDecisionForms
              locale={locale}
              orderId={order.id}
              projectId={order.project_id}
              requestChangesLabel={t.requestChanges}
              approveLabel={t.approve}
            />
          ) : null}
          {role === "brand" && orderApproved ? (
            <ReviewDeliveryFinalPanel
              locale={locale}
              role="brand"
              orderId={order.id}
              projectId={order.project_id}
              activeVersion={activeVersion}
              orderApproved={orderApproved}
              delivery={delivery ?? null}
            />
          ) : null}
          {role === "brand" && reviewUi?.canReleaseSettlement && order.project_id ? (
            <ReviewSettlementReleasePanel
              locale={locale}
              projectId={order.project_id}
              orderId={order.id}
            />
          ) : null}
          {role === "creator" && orderApproved ? (
            <ReviewDeliveryFinalPanel
              locale={locale}
              role="creator"
              orderId={order.id}
              projectId={order.project_id}
              activeVersion={activeVersion}
              orderApproved={orderApproved}
              delivery={delivery ?? null}
            />
          ) : null}
          {role === "creator" && canCreatorUpload ? (
            <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={handlePickFile}
                className="rounded-lg bg-[#5B5CFF] hover:bg-[#4a4bef]"
              >
                {uploadLabel}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="mt-4 overflow-x-auto">
          <ReviewCenterStepper
            locale={locale}
            order={order}
            deliverableCount={sortedVersions.length}
            activeStepIndex={reviewUi?.workflowStepIndex}
          />
        </div>
      </header>

      {flash === "completed" || orderApproved ? (
        <div className="bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-800">
          {locale === "zh" ? "交付已通过" : "Delivery approved"}
        </div>
      ) : null}
      {actionError ? (
        <div className="bg-red-50 px-4 py-2 text-center text-sm text-red-700">{actionError}</div>
      ) : null}

      <div className="min-h-0 flex-1 p-4 sm:p-6">
        {videoUrl ? (
          <div className="space-y-5">
            <div className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <ReviewCenterPlayer
                locale={locale}
                videoUrl={videoUrl}
                videoRef={videoRef}
                stageRef={stageRef}
                versionComments={versionComments}
                pinDraft={pinDraft}
                pinText={pinText}
                activeCommentId={activeCommentId}
                canAnnotate={canAnnotate}
                canBrandReview={canBrandReview}
                currentSec={currentSec}
                durationSec={durationSec}
                isPlaying={isPlaying}
                pending={pending}
                onStageClick={handleStageClick}
                onPinTextChange={setPinText}
                onSaveComment={() => {
                  if (pinDraft) savePinComment(pinDraft, pinText);
                }}
                onCancelPin={() => {
                  setPinDraft(null);
                  setPinText("");
                }}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
                onSelectComment={handleSelectComment}
                onTimeUpdate={() => setCurrentSec(videoRef.current?.currentTime ?? 0)}
                onLoadedMetadata={() => setDurationSec(videoRef.current?.duration ?? 0)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <ReviewCenterCommentPanel
                locale={locale}
                role={role}
                orderId={order.id}
                activeVersion={activeVersion}
                currentSec={currentSec}
                comments={comments}
                activeCommentId={activeCommentId}
                onCommentsChange={setComments}
                onSelectComment={handleSelectComment}
              />
            </div>
            {role === "creator" && canCreatorUpload ? (
              <ReviewCenterVersionStrip
                locale={locale}
                versions={sortedVersions}
                activeVersion={activeVersion}
                onSelect={setActiveVersion}
                canUpload={canCreatorUpload}
                uploadNotes={uploadNotes}
                onUploadNotesChange={setUploadNotes}
                onUpload={handleUpload}
                pending={pending}
                fileInputRef={fileRef}
                isFirstUpload={isFirstUpload}
              />
            ) : null}
          </div>
        ) : role === "creator" && canCreatorUpload ? (
          <ReviewCenterEmptyUpload
            locale={locale}
            uploadNotes={uploadNotes}
            onUploadNotesChange={setUploadNotes}
            onUpload={handleUpload}
            pending={pending}
            fileInputRef={fileRef}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
            {t.noVideo}
          </div>
        )}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
