"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReviewCommentAction, uploadVideoVersionAction } from "@/app/review-actions";
import type { Locale } from "@/lib/i18n";
import { uploadReviewVideoFile } from "@/lib/studioos/reviewer-version-upload-client";
import type { ReviewComment } from "@/lib/studioos/review-comment-types";
import type { PinDraft } from "@/components/studioos/review-engine/review-center-player";

export function useReviewCenterActions({
  locale,
  orderId,
  activeVersion,
  onCommentsChange,
  onError,
  onUploadComplete,
  onPinClear
}: {
  locale: Locale;
  orderId: string;
  activeVersion: number;
  onCommentsChange: (updater: (prev: ReviewComment[]) => ReviewComment[]) => void;
  onError: (message: string | null) => void;
  onUploadComplete: () => void;
  onPinClear: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function savePinComment(pinDraft: PinDraft, pinText: string) {
    if (!pinDraft || !pinText.trim()) return;
    startTransition(async () => {
      onError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      fd.set("version", String(activeVersion));
      fd.set("timestamp_sec", String(pinDraft.seconds));
      fd.set("pos_x", String(pinDraft.x));
      fd.set("pos_y", String(pinDraft.y));
      fd.set("body", pinText.trim());
      const result = await addReviewCommentAction(fd);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onCommentsChange((prev) => [...prev, result.comment]);
      onPinClear();
      router.refresh();
    });
  }

  function uploadVersion(file: File, uploadNotes: string) {
    startTransition(async () => {
      onError(null);
      const uploadResult = await uploadReviewVideoFile(orderId, file, () => undefined);
      if (!uploadResult.ok) {
        onError(uploadResult.error || (locale === "zh" ? "视频上传失败" : "Upload failed"));
        return;
      }
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("order_id", orderId);
      fd.set("file_url", uploadResult.url);
      if (uploadNotes.trim()) fd.set("notes", uploadNotes.trim());
      const result = await uploadVideoVersionAction(fd);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onUploadComplete();
      router.refresh();
    });
  }

  return { pending, savePinComment, uploadVersion };
}
