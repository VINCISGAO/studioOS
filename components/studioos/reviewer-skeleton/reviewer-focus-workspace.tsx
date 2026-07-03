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

export function ReviewerFocusWorkspace(props: {
  locale: Locale;
  role: "brand" | "creator";
  info: ReviewerShellHeaderInfo;
  onExit: () => void;
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
}) {
  const { locale, onExit, error, onDismissError, ...layoutProps } = props;

  return (
    <ReviewerReviewLayout
      shell="focus"
      header={
        <ReviewerFocusHeader
          locale={locale}
          onExit={onExit}
          errorMessage={error}
          onDismissError={onDismissError}
        />
      }
      locale={locale}
      {...layoutProps}
    />
  );
}
