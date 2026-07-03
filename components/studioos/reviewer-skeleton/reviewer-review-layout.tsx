"use client";

import { useState, type ReactNode } from "react";
import { ReviewerFocusToolbar } from "@/components/studioos/reviewer-skeleton/reviewer-focus-toolbar";
import {
  ReviewerFocusMobileNav,
  type ReviewerFocusMobilePanel
} from "@/components/studioos/reviewer-skeleton/reviewer-focus-mobile-nav";
import { ReviewerPortalCommentsPanel } from "@/components/studioos/reviewer-skeleton/reviewer-portal-comments-panel";
import { ReviewerPortalVersionSection } from "@/components/studioos/reviewer-skeleton/reviewer-portal-version-section";
import { ReviewerTimestampFilmstrip } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-filmstrip";
import { ReviewerTimestampPlayer } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-player";
import { ReviewerTimestampTimeline } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-timeline";
import type { ReviewerVersionUploadUI } from "@/components/studioos/reviewer-skeleton/reviewer-version-upload-zone";
import type { ReviewerVersionReadyState } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-use-versions";
import type { ReviewerTool, ReviewerAnnotationShape } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import type { ReviewerVideoStatus } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import type { Locale } from "@/lib/i18n";
import type { OrderStatus, StoredDeliverable } from "@/lib/order-types";
import type { ReviewComment, ReviewCommentStatus } from "@/lib/studioos/review-comment-types";
import { latestSubmittedDeliverableVersion } from "@/lib/studioos/review-upload-version";
import type { ReviewFocusTheme } from "@/lib/studioos/portal-focus-mode";
import { cn } from "@/lib/utils";

export function ReviewerReviewLayout({
  shell,
  focusTheme = "dark",
  header,
  locale,
  role,
  canUseTools,
  toolDisabledMessage,
  activeTool,
  canDraw,
  canComment,
  canReply,
  commentDisabledMessage,
  replyTargetId,
  replyTargetComment,
  onStartReply,
  onCancelReply,
  penColor,
  penSize,
  onToolChange,
  onUndo,
  onClearAnnotations,
  onPenColorChange,
  onPenSizeChange,
  videoRef,
  playbackVersion,
  playbackUrl,
  videoStatus,
  isPlaying,
  currentSec,
  durationSec,
  annotations,
  pendingAnnotations,
  onCreateAnnotation,
  onSelectAnnotation,
  onDeleteAnnotation,
  onClearSelection,
  onPlayPause,
  onSeek,
  onTimeUpdate,
  onLoadedMetadata,
  onLoadedData,
  onDurationChange,
  onCanPlay,
  onError,
  onPlay,
  onPause,
  onEnded,
  versionComments,
  onCommentSeek,
  onSelectComment,
  draftBody,
  onDraftBodyChange,
  onSubmitComment,
  pending,
  activeCommentId,
  onDeleteComment,
  onSetCommentStatus,
  deletedToast,
  sortedVersions,
  activeVersion,
  orderId,
  projectId,
  orderStatus,
  reviewCompleted,
  onSelectVersion,
  onRequestRevision,
  onApproveSuccess,
  onApproveError,
  onOrderStatusChange,
  revisionPending = false,
  fileRef,
  uploadUI,
  versionReadyState,
  onFileInputChange,
  onUploadFile,
  onCancelUpload,
  onOpenPicker,
  replaceUploadVersion = null,
  videoPlaybackFailed = false,
  onRevertUpload,
  revertPending = false,
  onViewReviewRecords,
  brandReviewRequestPending = false,
  canRevertUpload = true,
  paidRevisionSlotsUnlocked = 0,
  onUnlockPaidRevision,
  unlockPending = false
}: {
  shell: "focus" | "portal";
  focusTheme?: ReviewFocusTheme;
  header: ReactNode;
  locale: Locale;
  role: "brand" | "creator";
  canUseTools: boolean;
  toolDisabledMessage?: string;
  activeTool: ReviewerTool;
  canDraw: boolean;
  canComment: boolean;
  canReply: boolean;
  commentDisabledMessage?: string;
  replyTargetId: string | null;
  replyTargetComment: ReviewComment | null;
  onStartReply: (comment: ReviewComment) => void;
  onCancelReply: () => void;
  penColor: string;
  penSize: number;
  onToolChange: (tool: ReviewerTool) => void;
  onUndo: () => void;
  onClearAnnotations: () => void;
  onPenColorChange: (value: string) => void;
  onPenSizeChange: (value: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  playbackVersion: number;
  playbackUrl: string;
  videoStatus: ReviewerVideoStatus;
  isPlaying: boolean;
  currentSec: number;
  durationSec: number;
  annotations: ReviewerAnnotationShape[];
  pendingAnnotations: ReviewerAnnotationShape[];
  onCreateAnnotation: (annotation: ReviewerAnnotationShape, suggestedBody?: string) => void;
  onSelectAnnotation: (annotationId: string) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  onClearSelection: () => void;
  onPlayPause: () => void;
  onSeek: (sec: number) => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onLoadedData: () => void;
  onDurationChange: () => void;
  onCanPlay: () => void;
  onError: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  versionComments: ReviewComment[];
  onCommentSeek: (sec: number) => void;
  onSelectComment: (comment: ReviewComment) => void;
  draftBody: string;
  onDraftBodyChange: (value: string) => void;
  onSubmitComment: () => void;
  pending: boolean;
  activeCommentId: string | null;
  onDeleteComment?: (commentId: string) => void;
  onSetCommentStatus?: (commentId: string, status: ReviewCommentStatus) => void;
  deletedToast?: string | null;
  sortedVersions: StoredDeliverable[];
  activeVersion: number;
  orderId: string;
  projectId: string | null;
  orderStatus: OrderStatus;
  reviewCompleted: boolean;
  onSelectVersion: (version: number) => void;
  onRequestRevision: () => void;
  onApproveSuccess?: (message: string) => void;
  onApproveError?: (message: string) => void;
  onOrderStatusChange?: (status: OrderStatus) => void;
  revisionPending?: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  uploadUI: ReviewerVersionUploadUI;
  versionReadyState: Record<number, ReviewerVersionReadyState>;
  onFileInputChange: () => void;
  onUploadFile: (file: File) => void;
  onCancelUpload: () => void;
  onOpenPicker: () => void;
  replaceUploadVersion?: number | null;
  videoPlaybackFailed?: boolean;
  onRevertUpload?: () => void;
  revertPending?: boolean;
  onViewReviewRecords?: () => void;
  brandReviewRequestPending?: boolean;
  canRevertUpload?: boolean;
  paidRevisionSlotsUnlocked?: number;
  onUnlockPaidRevision?: () => void;
  unlockPending?: boolean;
}) {
  const isFocus = shell === "focus";
  const focusDark = focusTheme === "dark";
  const latestSubmittedVersion = latestSubmittedDeliverableVersion(sortedVersions);
  const latestVersion =
    latestSubmittedVersion ||
    sortedVersions[sortedVersions.length - 1]?.version ||
    activeVersion;
  const [mobilePanel, setMobilePanel] = useState<ReviewerFocusMobilePanel>("review");
  const pendingCommentCount = versionComments.filter((item) => item.status !== "resolved").length;
  const openBrandCommentCount = versionComments.filter(
    (item) => item.author === "brand" && item.status !== "resolved"
  ).length;

  const playerProps = {
    locale,
    role,
    focusLayout: isFocus,
    focusDark: isFocus && focusDark,
    portalLayout: !isFocus,
    compact: false,
    activeVersion,
    playbackVersion,
    latestVersion,
    reviewCompleted,
    videoUrl: playbackUrl,
    videoRef,
    videoStatus,
    isPlaying,
    currentSec,
    durationSec,
    canDraw,
    activeTool,
    penColor,
    penSize,
    annotations,
    pendingAnnotations,
    onCreateAnnotation,
    onSelectAnnotation,
    onDeleteAnnotation,
    onClearSelection,
    onPlayPause,
    onSeek,
    onTimeUpdate,
    onLoadedMetadata,
    onLoadedData,
    onDurationChange,
    onCanPlay,
    onError,
    onPlay,
    onPause,
    onEnded
  };

  const focusTimelineRail = (
    <div
      className={cn(
        "shrink-0 pb-1 pt-1 md:pb-2 md:pt-1.5",
        focusDark ? "bg-zinc-950" : "bg-white"
      )}
    >
      <div
        className={cn(
          "rounded-2xl border px-2 py-1.5 shadow-sm backdrop-blur md:px-3 md:py-2.5 lg:px-3.5 lg:py-3",
          focusDark
            ? "border-zinc-800/90 bg-zinc-900/55 shadow-black/20"
            : "border-zinc-200 bg-white shadow-zinc-200/70"
        )}
      >
        <ReviewerTimestampTimeline
          locale={locale}
          focusLayout
          focusDark={focusDark}
          mobileCompact
          videoStatus={videoStatus}
          comments={versionComments}
          durationSec={durationSec}
          currentSec={currentSec}
          onSeek={onCommentSeek}
          onSelectComment={onSelectComment}
        />
        <div className="mt-1.5 -translate-y-[20px] md:mt-1.5 lg:mt-2">
          <ReviewerTimestampFilmstrip
            focusLayout
            focusDark={focusDark}
            tabletCompact
            videoUrl={playbackUrl}
            playbackVersion={playbackVersion}
            videoStatus={videoStatus}
            durationSec={durationSec}
            currentSec={currentSec}
            onSeek={onCommentSeek}
          />
        </div>
      </div>
    </div>
  );

  const portalTimelineRail = (
    <>
      <ReviewerTimestampTimeline
        locale={locale}
        portalLayout
        videoStatus={videoStatus}
        comments={versionComments}
        durationSec={durationSec}
        currentSec={currentSec}
        onSeek={onCommentSeek}
        onSelectComment={onSelectComment}
      />
      <div className="mt-1.5">
        <ReviewerTimestampFilmstrip
          portalLayout
          videoUrl={playbackUrl}
          playbackVersion={playbackVersion}
          videoStatus={videoStatus}
          durationSec={durationSec}
          currentSec={currentSec}
          onSeek={onCommentSeek}
        />
      </div>
    </>
  );

  const commentsPanelProps = {
    locale,
    role,
    comments: versionComments,
    draftBody,
    canComment,
    canReply,
    disabledMessage: commentDisabledMessage,
    isPlaying,
    pending,
    activeCommentId,
    replyTargetId,
    replyTargetComment,
    onDraftBodyChange,
    onSubmit: onSubmitComment,
    onSelectComment: (comment: ReviewComment) => {
      onSelectComment(comment);
      setMobilePanel("comments");
    },
    onStartReply: (comment: ReviewComment) => {
      onStartReply(comment);
      setMobilePanel("comments");
    },
    onCancelReply,
    onDeleteComment,
    onSetCommentStatus,
    deletedToast
  };

  const focusCommentsPanelClassName = cn(
    "flex min-h-0 w-full shrink-0 flex-col border-l",
    focusDark ? "border-zinc-800" : "border-zinc-200",
    mobilePanel !== "comments" && "max-lg:hidden",
    "max-lg:flex-1 max-lg:max-h-none max-lg:border-l-0",
    "lg:h-full lg:max-h-none lg:w-[360px] lg:shrink-0 xl:w-[380px]"
  );

  const portalCommentsPanelClassName = cn(
    "flex min-h-0 w-full shrink-0 flex-col border-zinc-200 bg-white",
    mobilePanel !== "comments" && "max-md:hidden",
    "max-md:flex-1 max-md:max-h-none",
    "max-lg:max-h-[min(52dvh,520px)] max-lg:border-l-0 max-lg:border-t",
    "lg:h-full lg:max-h-none lg:w-[360px] lg:border-l xl:w-[380px]"
  );

  const commentsPanelClassName = isFocus ? focusCommentsPanelClassName : portalCommentsPanelClassName;

  const mobileNav = (
    <ReviewerFocusMobileNav
      locale={locale}
      panel={mobilePanel}
      commentCount={pendingCommentCount}
      onChange={setMobilePanel}
      theme={isFocus && focusDark ? "dark" : "light"}
      className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 lg:hidden"
    />
  );

  const brandToolbarSidebar =
    role === "brand" ? (
      <ReviewerFocusToolbar
        locale={locale}
        theme={isFocus ? focusTheme : "light"}
        activeTool={activeTool}
        canDraw={canUseTools}
        disabledMessage={toolDisabledMessage}
        penColor={penColor}
        penSize={penSize}
        onToolChange={onToolChange}
        onUndo={onUndo}
        onClearAnnotations={onClearAnnotations}
        onPenColorChange={onPenColorChange}
        onPenSizeChange={onPenSizeChange}
        surface="sidebar"
      />
    ) : null;

  const brandToolbarMobileDock =
    role === "brand" ? (
      <ReviewerFocusToolbar
        locale={locale}
        theme={isFocus ? focusTheme : "light"}
        activeTool={activeTool}
        canDraw={canUseTools}
        disabledMessage={toolDisabledMessage}
        penColor={penColor}
        penSize={penSize}
        onToolChange={onToolChange}
        onUndo={onUndo}
        onClearAnnotations={onClearAnnotations}
        onPenColorChange={onPenColorChange}
        onPenSizeChange={onPenSizeChange}
        surface="mobileDock"
      />
    ) : null;

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        isFocus
          ? focusDark
            ? "h-[100dvh] max-h-[100dvh] overflow-hidden bg-zinc-950 text-zinc-100"
            : "h-[100dvh] max-h-[100dvh] overflow-hidden bg-white text-zinc-900"
          : "h-full min-h-0 overflow-hidden bg-white"
      )}
    >
      {header}

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          isFocus ? "lg:flex-row" : "lg:flex-row"
        )}
      >
        {isFocus ? (
          <>
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden max-lg:px-0 lg:min-w-0 lg:py-2",
                mobilePanel !== "review" && "max-lg:hidden",
                "max-lg:pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
                focusDark ? "bg-zinc-950" : "bg-white"
              )}
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row md:items-stretch md:justify-center md:gap-2">
                {brandToolbarSidebar}
                <div className="flex min-h-0 min-w-0 flex-col overflow-hidden max-md:w-full md:w-[min(calc(100vw-76px),calc((100dvh-20rem)*16/9))] lg:w-[min(calc(100vw-360px),calc((100dvh-20rem)*16/9))] xl:w-[min(calc(100vw-380px),calc((100dvh-20rem)*16/9))]">
                  <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
                    <ReviewerTimestampPlayer {...playerProps} />
                  </div>
                  <div className={cn("shrink-0", focusDark ? "bg-zinc-950" : "bg-white")}>
                    {brandToolbarMobileDock}
                    {focusTimelineRail}
                  </div>
                  <div
                    className={cn(
                      "min-h-0 flex-1 border-t lg:hidden",
                      focusDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"
                    )}
                  >
                    <ReviewerPortalCommentsPanel
                      {...commentsPanelProps}
                      variant="focus"
                      focusTheme={focusTheme}
                      mobileFixedFooter
                      className="h-full border-l-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <ReviewerPortalCommentsPanel
              {...commentsPanelProps}
              variant="focus"
              focusTheme={focusTheme}
              mobileFixedFooter
              className={commentsPanelClassName}
            />
            {mobileNav}
          </>
        ) : (
          <>
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f9fb]",
                mobilePanel !== "review" && "max-md:hidden",
                "max-md:pb-[calc(3.25rem+env(safe-area-inset-bottom))]",
                "max-lg:overflow-y-auto lg:overflow-hidden"
              )}
            >
              <div className="min-h-0 flex-1 lg:overflow-y-auto">
                <div className="p-3 sm:p-4 md:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start">
                    {brandToolbarSidebar}
                    <div className="min-w-0 flex-1 space-y-3">
                      <ReviewerTimestampPlayer {...playerProps} />
                      <div className="rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-sm sm:p-3">
                        {portalTimelineRail}
                      </div>
                    </div>
                  </div>
                </div>
                <ReviewerPortalVersionSection
                  locale={locale}
                  role={role}
                  versions={sortedVersions}
                  activeVersion={activeVersion}
                  activeReviewVersion={activeVersion}
                  orderId={orderId}
                  projectId={projectId}
                  orderStatus={orderStatus}
                  reviewCompleted={reviewCompleted}
                  uploadUI={uploadUI}
                  fileRef={fileRef}
                  onSelectVersion={onSelectVersion}
                  onRequestRevision={onRequestRevision}
                  onApproveSuccess={onApproveSuccess}
                  onApproveError={onApproveError}
                  onOrderStatusChange={onOrderStatusChange}
                  revisionPending={revisionPending}
                  onFileInputChange={onFileInputChange}
                  onUploadFile={onUploadFile}
                  onCancelUpload={onCancelUpload}
                  onOpenPicker={onOpenPicker}
                  replaceUploadVersion={replaceUploadVersion}
                  videoPlaybackFailed={videoPlaybackFailed}
                  onRevertUpload={onRevertUpload}
                  revertPending={revertPending}
                  onViewReviewRecords={onViewReviewRecords}
                  brandReviewRequestPending={brandReviewRequestPending}
                  canRevertUpload={canRevertUpload}
                  paidRevisionSlotsUnlocked={paidRevisionSlotsUnlocked}
                  openBrandCommentCount={openBrandCommentCount}
                  onUnlockPaidRevision={onUnlockPaidRevision}
                  unlockPending={unlockPending}
                />
              </div>
            </div>

            <div id="review-portal-comments-panel" className={cn("min-h-0 shrink-0", commentsPanelClassName)}>
            <ReviewerPortalCommentsPanel
              {...commentsPanelProps}
              mobileFixedFooter
              className="h-full"
            />
            </div>
            {mobileNav}
          </>
        )}
      </div>
    </div>
  );
}
