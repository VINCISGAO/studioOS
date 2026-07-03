"use client";

import { ReviewerFocusHeader } from "@/components/studioos/reviewer-skeleton/reviewer-focus-header";
import { ReviewerReviewLayout } from "@/components/studioos/reviewer-skeleton/reviewer-review-layout";
import type { ReviewerShellHeaderInfo } from "@/components/studioos/reviewer-skeleton/reviewer-shell-types";
import type { ReviewerVersionUploadUI } from "@/components/studioos/reviewer-skeleton/reviewer-version-upload-zone";
import type { ReviewerVersionReadyState } from "@/components/studioos/reviewer-skeleton/reviewer-timestamp-use-versions";
import type { ReviewerTool, ReviewerAnnotationShape } from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import type { ReviewerVideoStatus } from "@/components/studioos/reviewer-v1/reviewer-v1-use-playback";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import type { ReviewFocusTheme } from "@/lib/studioos/portal-focus-mode";

export function ReviewerFocusWorkspace(props: {
  locale: Locale;
  role: "brand" | "creator";
  info: ReviewerShellHeaderInfo;
  onExit: () => void;
  focusTheme?: ReviewFocusTheme;
  onFocusThemeChange?: (theme: ReviewFocusTheme) => void;
  error: string | null;
  onDismissError: () => void;
  activeTool: ReviewerTool;
  canDraw: boolean;
  canComment: boolean;
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
  onSetCommentStatus?: (commentId: string, status: ReviewComment["status"]) => void;
  deletedToast?: string | null;
  sortedVersions: StoredDeliverable[];
  activeVersion: number;
  onSelectVersion: (version: number) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  uploadUI: ReviewerVersionUploadUI;
  versionReadyState: Record<number, ReviewerVersionReadyState>;
  onFileInputChange: () => void;
  onUploadFile: (file: File) => void;
  onCancelUpload: () => void;
  onOpenPicker: () => void;
  reviewCompleted?: boolean;
  orderId: string;
  projectId: string | null;
  orderStatus: import("@/lib/order-types").OrderStatus;
  onRequestRevision: () => void;
  onApproveSuccess?: (message: string) => void;
  onApproveError?: (message: string) => void;
  onOrderStatusChange?: (status: import("@/lib/order-types").OrderStatus) => void;
}) {
  const {
    locale,
    onExit,
    focusTheme = "dark",
    onFocusThemeChange,
    error,
    onDismissError,
    ...layoutProps
  } = props;

  return (
    <ReviewerReviewLayout
      shell="focus"
      focusTheme={focusTheme}
      header={
        <ReviewerFocusHeader
          locale={locale}
          theme={focusTheme}
          onThemeChange={onFocusThemeChange ?? (() => undefined)}
          onExit={onExit}
          errorMessage={error}
          onDismissError={onDismissError}
        />
      }
      locale={locale}
      canUseTools={layoutProps.canDraw}
      canReply={false}
      replyTargetId={null}
      replyTargetComment={null}
      onStartReply={() => undefined}
      onCancelReply={() => undefined}
      toolDisabledMessage={layoutProps.canDraw ? undefined : layoutProps.role === "creator" ? "Read-only" : undefined}
      {...layoutProps}
      reviewCompleted={layoutProps.reviewCompleted ?? false}
    />
  );
}
