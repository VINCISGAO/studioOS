"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addReviewCommentAction,
  addStudioReviewCommentAction,
  deleteReviewCommentAction,
  resolveReviewCommentAction,
  updateReviewCommentStatusAction
} from "@/app/review-actions";
import { serializeAnnotations } from "@/components/studioos/reviewer-v1/reviewer-v1-serialize";
import {
  annotationFromComment,
  type ReviewerAnnotationShape
} from "@/components/studioos/reviewer-v1/reviewer-v1-types";
import type { Locale } from "@/lib/i18n";
import { readVideoCommentTimestampSec } from "@/lib/studioos/review-comment-time";
import { mergeReviewCommentsForUi, sortReviewCommentsForUi } from "@/lib/studioos/review-comment-ui";
import {
  reviewAnnotationComments,
  reviewLatestAnnotationCommentAtFrame,
  reviewSameAnnotationFrame
} from "@/lib/studioos/reviewer-annotation-ui";
import type { ReviewComment, ReviewCommentStatus } from "@/lib/studioos/review-comment-types";

export function useReviewerTimestampComments({
  locale,
  orderId,
  role,
  initialComments,
  activeVersion,
  videoRef,
  currentSec,
  canComment,
  canReply,
  onCommentDeleted
}: {
  locale: Locale;
  orderId: string;
  role: "brand" | "creator";
  initialComments: ReviewComment[];
  activeVersion: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentSec: number;
  canComment: boolean;
  canReply: boolean;
  onCommentDeleted?: () => void;
}) {
  const router = useRouter();
  const undoCommentIdsRef = useRef<string[]>([]);
  const deletedCommentIdsRef = useRef<Set<string>>(new Set());
  const draftFrameSecRef = useRef<number | null>(null);
  const commitDraftRef = useRef<(onError?: (message: string) => void) => void>(() => {});
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState(initialComments);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [draftFrameSec, setDraftFrameSec] = useState<number | null>(null);
  const [pendingAnnotations, setPendingAnnotations] = useState<ReviewerAnnotationShape[]>([]);

  useEffect(() => {
    const tombstones = deletedCommentIdsRef.current;
    const serverComments = initialComments.filter((item) => !tombstones.has(item.id));
    setComments((prev) => {
      const local = prev.filter((item) => !tombstones.has(item.id));
      return mergeReviewCommentsForUi(local, serverComments, tombstones);
    });
  }, [initialComments]);

  const versionComments = useMemo(
    () =>
      [...comments]
        .filter((item) => item.version === activeVersion)
        .sort((a, b) => a.timestamp_sec - b.timestamp_sec),
    [comments, activeVersion]
  );

  const visibleAnnotations = useMemo(() => {
    if (activeCommentId) {
      const target = versionComments.find((item) => item.id === activeCommentId);
      return target ? annotationFromComment(target) : [];
    }
    return versionComments
      .filter((item) => reviewSameAnnotationFrame(item.timestamp_sec, currentSec))
      .flatMap((item) => annotationFromComment(item));
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

  const resetVersionSelection = useCallback(() => {
    setActiveCommentId(null);
    setReplyTargetId(null);
    clearDraftSession();
    setDraftBody("");
    undoCommentIdsRef.current = [];
  }, [clearDraftSession]);

  const replyTargetComment = useMemo(
    () => (replyTargetId ? versionComments.find((item) => item.id === replyTargetId) ?? null : null),
    [replyTargetId, versionComments]
  );

  const startReply = useCallback(
    (comment: ReviewComment) => {
      if (role !== "creator" || comment.author !== "brand") return;
      setReplyTargetId(comment.id);
      setActiveCommentId(comment.id);
      setDraftBody("");
    },
    [role]
  );

  const cancelReply = useCallback(() => {
    setReplyTargetId(null);
    setDraftBody("");
  }, []);

  const findCommentIdForAnnotation = useCallback(
    (annotationId: string) => {
      const match = versionComments.find(
        (item) => item.id === annotationId || item.annotations?.some((ann) => ann.id === annotationId)
      );
      return match?.id ?? null;
    },
    [versionComments]
  );

  const handleDeleteComment = useCallback(
    (commentId: string, onError: (message: string) => void) => {
      startTransition(async () => {
        const fd = new FormData();
        fd.set("lang", locale);
        fd.set("order_id", orderId);
        fd.set("comment_id", commentId);
        const result = await deleteReviewCommentAction(fd);
        if (!result.ok) {
          onError(result.error);
          return;
        }
        deletedCommentIdsRef.current.add(commentId);
        undoCommentIdsRef.current = undoCommentIdsRef.current.filter((id) => id !== commentId);
        setComments((prev) => prev.filter((item) => item.id !== commentId));
        if (activeCommentId === commentId) {
          setActiveCommentId(null);
        }
        if (replyTargetId === commentId) {
          setReplyTargetId(null);
          setDraftBody("");
        }
        onCommentDeleted?.();
        router.refresh();
      });
    },
    [activeCommentId, locale, onCommentDeleted, orderId, replyTargetId, router]
  );

  const handleSetCommentStatus = useCallback(
    (
      commentId: string,
      status: ReviewCommentStatus,
      onError: (message: string) => void
    ) => {
      startTransition(async () => {
        const nextStatus: ReviewCommentStatus = role === "creator" ? "resolved" : status;
        const fd = new FormData();
        fd.set("lang", locale);
        fd.set("order_id", orderId);
        fd.set("comment_id", commentId);
        fd.set("status", nextStatus);

        const result =
          role === "creator"
            ? await resolveReviewCommentAction(fd)
            : await updateReviewCommentStatusAction(fd);

        if (!result.ok) {
          onError(result.error);
          return;
        }

        setComments((prev) =>
          sortReviewCommentsForUi(prev.map((item) => (item.id === result.comment.id ? result.comment : item)))
        );
        router.refresh();
      });
    },
    [locale, orderId, role, router]
  );

  const handleUndo = useCallback(
    (currentTimestampSec: number, onError: (message: string) => void) => {
      if (pendingAnnotations.length) {
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
      const lastCommentId = undoCommentIdsRef.current.pop();
      if (lastCommentId) {
        handleDeleteComment(lastCommentId, onError);
        return;
      }
      const latest = reviewLatestAnnotationCommentAtFrame(versionComments, currentTimestampSec);
      if (latest) {
        handleDeleteComment(latest.id, onError);
      }
    },
    [handleDeleteComment, pendingAnnotations.length, versionComments]
  );

  const submitComment = useCallback(
    (
      body: string,
      annotations: ReviewerAnnotationShape[] = [],
      options?: {
        pendingId?: string;
        timestampSec?: number;
        onError?: (message: string) => void;
        bypassCanComment?: boolean;
      }
    ) => {
      const trimmedBody = body.trim();
      if (!trimmedBody) return;
      if (role === "creator") {
        if (!canReply || !replyTargetId) {
          options?.onError?.(
            locale === "zh" ? "请先点击 Brand 批注上的「回复」" : "Use Reply on a Brand note first"
          );
          return;
        }
      } else if (!options?.bypassCanComment && !canComment) {
        return;
      }

      const replyParent =
        role === "creator" && replyTargetId
          ? versionComments.find((item) => item.id === replyTargetId)
          : null;
      if (role === "creator" && (!replyParent || replyParent.author !== "brand")) {
        options?.onError?.(locale === "zh" ? "只能回复 Brand 批注" : "You can only reply to Brand notes");
        return;
      }

      const timestampSec =
        replyParent?.timestamp_sec ??
        options?.timestampSec ??
        readVideoCommentTimestampSec(videoRef.current, currentSec);

      startTransition(async () => {
        const fd = new FormData();
        fd.set("lang", locale);
        fd.set("order_id", orderId);
        fd.set("version", String(activeVersion));
        fd.set("timestamp_sec", String(timestampSec));
        fd.set("body", trimmedBody);
        if (role === "creator" && replyTargetId) {
          fd.set("reply_to_comment_id", replyTargetId);
        }
        if (annotations.length) {
          fd.set("annotations_json", serializeAnnotations(annotations, timestampSec));
        }

        const result =
          role === "creator"
            ? await addStudioReviewCommentAction(fd)
            : await addReviewCommentAction(fd);
        if (!result.ok) {
          options?.onError?.(result.error);
          if (options?.pendingId) {
            setPendingAnnotations((prev) => prev.filter((item) => item.id !== options.pendingId));
          }
          return;
        }

        if (options?.pendingId) {
          setPendingAnnotations((prev) => prev.filter((item) => item.id !== options.pendingId));
        }
        undoCommentIdsRef.current.push(result.comment.id);
        setComments((prev) => sortReviewCommentsForUi([...prev, result.comment]));
        setDraftBody("");
        setReplyTargetId(null);
        setActiveCommentId(result.comment.id);
        router.refresh();
      });
    },
    [activeVersion, canComment, canReply, currentSec, locale, orderId, replyTargetId, role, router, versionComments, videoRef]
  );

  const commitDraftAnnotations = useCallback(
    (onError?: (message: string) => void) => {
      if (!pendingAnnotations.length || draftFrameSecRef.current === null) return;
      const frameSec = draftFrameSecRef.current;
      const annotations = [...pendingAnnotations];
      clearDraftSession();
      submitComment(defaultAnnotationBody, annotations, {
        timestampSec: frameSec,
        onError,
        bypassCanComment: true
      });
    },
    [clearDraftSession, defaultAnnotationBody, pendingAnnotations, submitComment]
  );

  commitDraftRef.current = commitDraftAnnotations;

  useEffect(() => {
    if (!pendingAnnotations.length || draftFrameSec === null) return;
    if (reviewSameAnnotationFrame(currentSec, draftFrameSec)) return;
    commitDraftRef.current();
  }, [currentSec, draftFrameSec, pendingAnnotations.length]);

  const handleCreateAnnotation = useCallback(
    (annotation: ReviewerAnnotationShape) => {
      if (!canComment) return;
      const frameSec = readVideoCommentTimestampSec(videoRef.current, currentSec);
      if (draftFrameSecRef.current === null) {
        draftFrameSecRef.current = frameSec;
        setDraftFrameSec(frameSec);
      }
      setPendingAnnotations((prev) => [...prev, annotation]);
    },
    [canComment, currentSec, videoRef]
  );

  const handleSubmitComment = useCallback(
    (onError?: (message: string) => void) => {
      if (pendingAnnotations.length && draftFrameSecRef.current !== null) {
        const frameSec = draftFrameSecRef.current;
        const annotations = [...pendingAnnotations];
        const body = draftBody.trim() || defaultAnnotationBody;
        clearDraftSession();
        submitComment(body, annotations, { timestampSec: frameSec, onError });
        return;
      }
      submitComment(draftBody, [], { onError });
    },
    [clearDraftSession, defaultAnnotationBody, draftBody, pendingAnnotations, submitComment]
  );

  const handleSelectComment = useCallback((comment: ReviewComment, pauseAt: (sec: number) => void) => {
    setActiveCommentId(comment.id);
    pauseAt(comment.timestamp_sec);
  }, []);

  const handleCommentSeek = useCallback((sec: number, pauseAt: (sec: number) => void) => {
    setActiveCommentId(null);
    pauseAt(sec);
  }, []);

  const handleSelectAnnotation = useCallback(
    (annotationId: string, pauseAt: (sec: number) => void) => {
      const commentId = findCommentIdForAnnotation(annotationId);
      if (!commentId) return;
      const comment = versionComments.find((item) => item.id === commentId);
      if (!comment) return;
      handleSelectComment(comment, pauseAt);
    },
    [findCommentIdForAnnotation, handleSelectComment, versionComments]
  );

  const handleDeleteAnnotation = useCallback(
    (annotationId: string, onError: (message: string) => void) => {
      setPendingAnnotations((prev) => {
        const next = prev.filter((item) => item.id !== annotationId);
        if (!next.length) {
          draftFrameSecRef.current = null;
          setDraftFrameSec(null);
        }
        return next;
      });
      const commentId = findCommentIdForAnnotation(annotationId);
      if (!commentId) return;
      handleDeleteComment(commentId, onError);
    },
    [findCommentIdForAnnotation, handleDeleteComment]
  );

  const handleClearAnnotations = useCallback(
    (onError: (message: string) => void) => {
      clearDraftSession();
      setActiveCommentId(null);

      const annotationComments = reviewAnnotationComments(versionComments);
      if (!annotationComments.length) return;

      startTransition(async () => {
        for (const comment of annotationComments) {
          const fd = new FormData();
          fd.set("lang", locale);
          fd.set("order_id", orderId);
          fd.set("comment_id", comment.id);
          const result = await deleteReviewCommentAction(fd);
          if (!result.ok) {
            onError(result.error);
            return;
          }
          deletedCommentIdsRef.current.add(comment.id);
          undoCommentIdsRef.current = undoCommentIdsRef.current.filter((id) => id !== comment.id);
        }

        const removedIds = new Set(annotationComments.map((item) => item.id));
        setComments((prev) => prev.filter((item) => !removedIds.has(item.id)));
        onCommentDeleted?.();
        router.refresh();
      });
    },
    [clearDraftSession, locale, onCommentDeleted, orderId, router, versionComments]
  );

  return {
    pending,
    comments,
    versionComments,
    visibleAnnotations,
    visiblePendingAnnotations,
    activeCommentId,
    setActiveCommentId,
    draftBody,
    setDraftBody,
    pendingAnnotations,
    draftFrameSec,
    resetVersionSelection,
    handleUndo,
    handleCreateAnnotation,
    handleSelectComment,
    handleCommentSeek,
    handleSelectAnnotation,
    handleDeleteAnnotation,
    handleDeleteComment,
    handleSetCommentStatus,
    handleClearAnnotations,
    handleSubmitComment,
    submitComment,
    replyTargetId,
    replyTargetComment,
    startReply,
    cancelReply
  };
}
