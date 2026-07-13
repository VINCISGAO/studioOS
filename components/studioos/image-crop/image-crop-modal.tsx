"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  ImageCropViewport,
  type ImageCropViewportState
} from "@/components/studioos/image-crop/image-crop-viewport";
import type { Locale } from "@/lib/i18n";
import {
  cropAreaFromTransform,
  prepareImageCropPreview,
  renderCroppedImageFile,
  type ImageCropPreview
} from "@/lib/studioos/image-crop-client";
import type { ProfileImageOutputPreset } from "@/lib/studioos/profile-image-output";

const copy = {
  en: {
    title: "Crop image",
    description: "Drag to reposition and use the slider to zoom.",
    hint: "Drag to reposition",
    zoom: "Zoom",
    cancel: "Cancel",
    confirm: "Apply crop",
    processing: "Processing…",
    loading: "Loading image…",
    loadFailed: "Could not load this image. Please upload JPG, PNG, or WebP."
  },
  zh: {
    title: "裁剪图片",
    description: "拖动调整位置，使用滑块缩放。",
    hint: "拖动调整位置",
    zoom: "缩放",
    cancel: "取消",
    confirm: "确认裁剪",
    processing: "处理中…",
    loading: "正在加载图片…",
    loadFailed: "无法加载该图片，请上传 JPG、PNG 或 WebP 格式。"
  }
};

type ImageCropModalProps = {
  file: File;
  aspectRatio: number;
  locale: Locale;
  fileNamePrefix?: string;
  outputPreset?: ProfileImageOutputPreset;
  onConfirm: (file: File) => void | Promise<void>;
  onCancel: () => void;
};

export function ImageCropModal({
  file,
  aspectRatio,
  locale,
  fileNamePrefix,
  outputPreset = "cover",
  onConfirm,
  onCancel
}: ImageCropModalProps) {
  const t = copy[locale];
  const [preview, setPreview] = useState<ImageCropPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cropState, setCropState] = useState<ImageCropViewportState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPreview(null);
    setLoadError(null);
    setCropState(null);

    void prepareImageCropPreview(file)
      .then((next) => {
        if (!cancelled) setPreview(next);
      })
      .catch(() => {
        if (!cancelled) setLoadError(t.loadFailed);
      });

    return () => {
      cancelled = true;
    };
  }, [file, t.loadFailed]);

  useEffect(() => {
    return () => preview?.revoke?.();
  }, [preview]);

  const handleTransformChange = useCallback((state: ImageCropViewportState) => {
    setCropState(state);
  }, []);

  async function handleConfirm() {
    if (!cropState) return;
    setBusy(true);
    try {
      const crop = cropAreaFromTransform(
        cropState.naturalSize.width,
        cropState.naturalSize.height,
        cropState.frameSize.width,
        cropState.frameSize.height,
        cropState.transform
      );
      const cropped = await renderCroppedImageFile(file, crop, { fileNamePrefix, outputPreset });
      void onConfirm(cropped);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent className="box-border flex w-[min(92vw,520px)] max-w-[calc(100vw-2rem)] min-w-0 flex-col gap-0 overflow-hidden rounded-[24px] border-zinc-200 p-0">
        <DialogHeader className="min-w-0 space-y-1 px-6 pb-2 pr-12 pt-6 text-left">
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="box-border min-w-0 overflow-hidden px-6 py-2">
          {loadError ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-[22px] border border-red-100 bg-red-50 px-4 text-center text-sm text-red-700">
              {loadError}
            </div>
          ) : !preview ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-[22px] border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.loading}
            </div>
          ) : (
            <ImageCropViewport
              src={preview.url}
              naturalWidth={preview.width}
              naturalHeight={preview.height}
              aspectRatio={aspectRatio}
              hint={t.hint}
              zoomLabel={t.zoom}
              onTransformChange={handleTransformChange}
            />
          )}
        </div>

        <DialogFooter className="box-border w-full min-w-0 gap-2 border-t border-zinc-100 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 sm:w-auto"
            onClick={onCancel}
            disabled={busy}
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => void handleConfirm()}
            disabled={busy || !cropState || Boolean(loadError)}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? t.processing : t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
