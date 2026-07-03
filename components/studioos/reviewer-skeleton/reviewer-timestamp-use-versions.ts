"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadVideoVersionAction } from "@/app/review-actions";
import type { ReviewerVersionUploadUI } from "@/components/studioos/reviewer-skeleton/reviewer-version-upload-zone";
import type { Locale } from "@/lib/i18n";
import type { StoredDeliverable } from "@/lib/order-types";
import {
  DEMO_REVIEW_VIDEO_FALLBACKS,
  isDemoReviewOrder,
  resolveReviewPlaybackUrl
} from "@/lib/studioos/review-video-url";
import { latestDeliverableVersion } from "@/lib/studioos/review-utils";
import {
  animateUploadProgress,
  uploadReviewVideoFile,
  validateReviewerVideoFile
} from "@/lib/studioos/reviewer-version-upload-client";

const IDLE_UPLOAD_UI: ReviewerVersionUploadUI = {
  phase: "idle",
  progress: 0,
  loadedBytes: 0,
  totalBytes: 0
};

export type ReviewerVersionReadyState = "processing" | "ready";

export function useReviewerTimestampVersions({
  locale,
  orderId,
  deliverables,
  initialVersion
}: {
  locale: Locale;
  orderId: string;
  deliverables: StoredDeliverable[];
  initialVersion: number;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const stopProgressRef = useRef<(() => void) | null>(null);
  const usedFallbackRef = useRef(false);
  const fallbackIndexRef = useRef(0);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadUI, setUploadUI] = useState<ReviewerVersionUploadUI>(IDLE_UPLOAD_UI);
  const [versionReadyState, setVersionReadyState] = useState<Record<number, ReviewerVersionReadyState>>({});
  const [deliverablesState, setDeliverablesState] = useState(deliverables);
  const [activeVersion, setActiveVersion] = useState(
    initialVersion || latestDeliverableVersion(deliverables)
  );

  useEffect(() => {
    setDeliverablesState(deliverables);
    const nextVersion = initialVersion || latestDeliverableVersion(deliverables);
    if (nextVersion > 0) {
      setActiveVersion(nextVersion);
    }
  }, [deliverables, initialVersion]);

  useEffect(() => {
    return () => {
      xhrRef.current?.abort();
      stopProgressRef.current?.();
    };
  }, []);

  const activeDeliverable =
    deliverablesState.find((item) => item.version === activeVersion) ??
    deliverablesState.find(
      (item) => item.version === latestDeliverableVersion(deliverablesState)
    ) ??
    deliverablesState[0];

  const resolvedVideoUrl = useMemo(
    () =>
      resolveReviewPlaybackUrl({
        fileUrl: activeDeliverable?.file_url ?? "",
        orderId,
        version: activeVersion
      }),
    [activeDeliverable?.file_url, orderId, activeVersion]
  );

  const [playbackUrl, setPlaybackUrl] = useState(resolvedVideoUrl);

  useEffect(() => {
    setPlaybackUrl(resolvedVideoUrl);
    usedFallbackRef.current = false;
    fallbackIndexRef.current = 0;
  }, [resolvedVideoUrl]);

  const handleVideoError = useCallback(
    (onError: () => void) => {
      if (!isDemoReviewOrder(orderId)) {
        onError();
        return;
      }

      const nextIndex = fallbackIndexRef.current + 1;
      if (nextIndex < DEMO_REVIEW_VIDEO_FALLBACKS.length) {
        fallbackIndexRef.current = nextIndex;
        usedFallbackRef.current = true;
        setPlaybackUrl(DEMO_REVIEW_VIDEO_FALLBACKS[nextIndex]);
        return;
      }
      onError();
    },
    [orderId]
  );

  const selectVersion = useCallback((version: number) => {
    setActiveVersion((current) => (current === version ? current : version));
  }, []);

  const resetUploadUI = useCallback(() => {
    stopProgressRef.current?.();
    stopProgressRef.current = null;
    setUploadUI(IDLE_UPLOAD_UI);
  }, []);

  const cancelUpload = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    resetUploadUI();
  }, [resetUploadUI]);

  const openFilePicker = useCallback(() => {
    if (uploadUI.phase !== "idle") return;
    fileRef.current?.click();
  }, [uploadUI.phase]);

  const runProcessingAnimation = useCallback(async () => {
    setUploadUI((prev) => ({ ...prev, phase: "processing", progress: 0 }));
    await new Promise<void>((resolve) => {
      stopProgressRef.current = animateUploadProgress(
        8000,
        (progress) => setUploadUI((prev) => ({ ...prev, progress })),
        resolve
      );
    });
  }, []);

  const beginUpload = useCallback(
    async (file: File, onSuccess: () => void, onError: (message: string) => void) => {
      if (uploadUI.phase !== "idle") return;

      const validationError = validateReviewerVideoFile(file, locale);
      if (validationError) {
        onError(validationError);
        return;
      }

      setUploadUI({
        phase: "uploading",
        progress: 0,
        loadedBytes: 0,
        totalBytes: file.size
      });

      const uploadResult = await uploadReviewVideoFile(
        orderId,
        file,
        (loaded, total) => {
          setUploadUI((prev) => ({
            ...prev,
            loadedBytes: loaded,
            totalBytes: total,
            progress: total > 0 ? Math.round((loaded / total) * 100) : prev.progress
          }));
        },
        (xhr) => {
          xhrRef.current = xhr;
        }
      );

      xhrRef.current = null;

      if (!uploadResult.ok) {
        if (uploadResult.error !== "Cancelled") {
          onError(uploadResult.error);
        }
        resetUploadUI();
        return;
      }

      await runProcessingAnimation();

      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      fd.set("file_url", uploadResult.url);
      fd.set("version", String(uploadResult.version));
      if (uploadNotes.trim()) fd.set("notes", uploadNotes.trim());

      const result = await uploadVideoVersionAction(fd);
      if (!result.ok) {
        onError(result.error);
        resetUploadUI();
        return;
      }

      setUploadNotes("");
      if (fileRef.current) fileRef.current.value = "";
      setDeliverablesState((prev) => {
        const withoutVersion = prev.filter((item) => item.version !== result.deliverable.version);
        return [...withoutVersion, result.deliverable].sort((a, b) => a.version - b.version);
      });
      setActiveVersion(result.deliverable.version);
      const playback = resolveReviewPlaybackUrl({
        fileUrl: result.deliverable.file_url,
        orderId,
        version: result.deliverable.version
      });
      setPlaybackUrl(`${playback}?t=${Date.now()}`);
      setVersionReadyState((prev) => ({
        ...prev,
        [result.deliverable.version]: "processing"
      }));

      window.setTimeout(() => {
        setVersionReadyState((prev) => ({
          ...prev,
          [result.deliverable.version]: "ready"
        }));
      }, 4000);

      resetUploadUI();
      onSuccess();
      router.refresh();
    },
    [locale, orderId, resetUploadUI, router, runProcessingAnimation, uploadNotes, uploadUI.phase]
  );

  const handleFileInputChange = useCallback(
    (onSuccess: () => void, onError: (message: string) => void) => {
      const file = fileRef.current?.files?.[0];
      if (!file) return;
      if (fileRef.current) fileRef.current.value = "";
      void beginUpload(file, onSuccess, onError);
    },
    [beginUpload]
  );

  const handleUploadFile = useCallback(
    (file: File, onSuccess: () => void, onError: (message: string) => void) => {
      void beginUpload(file, onSuccess, onError);
    },
    [beginUpload]
  );

  const uploadPending = uploadUI.phase !== "idle";

  return {
    fileRef,
    uploadPending,
    uploadUI,
    versionReadyState,
    uploadNotes,
    setUploadNotes,
    deliverablesState,
    activeVersion,
    setActiveVersion: selectVersion,
    activeDeliverable,
    playbackUrl,
    handleVideoError,
    openFilePicker,
    cancelUpload,
    handleFileInputChange,
    handleUploadFile
  };
}
