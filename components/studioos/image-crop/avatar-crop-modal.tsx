"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Lock, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AvatarCropEditor,
  type AvatarCropEditorHandle
} from "@/components/studioos/image-crop/avatar-crop-editor";
import type { ImageCropViewportState } from "@/components/studioos/image-crop/image-crop-viewport";
import type { Locale } from "@/lib/i18n";
import {
  cropAreaFromTransform,
  prepareImageCropPreview,
  renderCroppedImageFile,
  type ImageCropPreview
} from "@/lib/studioos/image-crop-client";
import type { ProfileImageOutputPreset } from "@/lib/studioos/profile-image-output";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    title: "Adjust avatar",
    description: "Drag to reposition, scroll or use the slider to zoom, and keep your face centered.",
    dragHint: "Drag image to reposition",
    zoom: "Zoom",
    reset: "Reset",
    cancel: "Cancel",
    confirm: "Save avatar",
    processing: "Saving…",
    loading: "Loading image…",
    loadFailed: "Could not load this image. Please upload JPG, PNG, or WebP.",
    privacy: "Image is only used for your avatar. Your original file stays private."
  },
  zh: {
    title: "调整头像",
    description: "拖动图片移动位置，滚轮或滑块缩放，确保头像居中显示。",
    dragHint: "拖动图片移动位置",
    zoom: "缩放",
    reset: "重置",
    cancel: "取消",
    confirm: "保存头像",
    processing: "保存中…",
    loading: "正在加载图片…",
    loadFailed: "无法加载该图片，请上传 JPG、PNG 或 WebP 格式。",
    privacy: "图片仅用于头像显示，不会公开你的原图。"
  }
};

type AvatarCropModalProps = {
  file: File;
  locale: Locale;
  fileNamePrefix?: string;
  outputPreset?: ProfileImageOutputPreset;
  onConfirm: (file: File) => void | Promise<void>;
  onCancel: () => void;
};

export function AvatarCropModal({
  file,
  locale,
  fileNamePrefix,
  outputPreset = "avatar",
  onConfirm,
  onCancel
}: AvatarCropModalProps) {
  const t = copy[locale];
  const editorRef = useRef<AvatarCropEditorHandle>(null);
  const [preview, setPreview] = useState<ImageCropPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cropState, setCropState] = useState<ImageCropViewportState | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
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
    const percent = editorRef.current?.getZoomPercent();
    if (percent != null) setZoomPercent(percent);
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
      <DialogContent
        className={cn(
          "box-border flex w-[min(calc(100vw-2rem),340px)] max-w-[min(calc(100vw-2rem),340px)] min-w-0 flex-col gap-0 border-0 bg-transparent p-0 shadow-none sm:w-[min(92vw,480px)] sm:max-w-[480px]",
          "top-1/2 max-h-[min(90dvh,680px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden sm:max-h-[min(92dvh,720px)]",
          "[&>button]:hidden"
        )}
      >
        <div className="flex max-h-[inherit] min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:rounded-[20px]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:items-start sm:px-8 sm:pb-5 sm:pt-7">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold tracking-tight text-zinc-900 sm:text-xl">{t.title}</h2>
              <p className="mt-1 hidden text-xs leading-relaxed text-zinc-500 sm:block sm:mt-1.5 sm:max-w-xl sm:text-sm">
                {t.description}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 sm:h-9 sm:w-9"
              aria-label={t.cancel}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-3 sm:px-8 sm:py-6">
            {loadError ? (
              <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-red-100 bg-red-50 px-4 text-center text-sm text-red-700">
                {loadError}
              </div>
            ) : !preview ? (
              <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.loading}
              </div>
            ) : (
              <div className="mx-auto w-full min-w-0 max-w-[min(68vw,248px)] space-y-3 sm:max-w-[min(100%,320px)] sm:space-y-5">
                <AvatarCropEditor
                  ref={editorRef}
                  src={preview.url}
                  naturalWidth={preview.width}
                  naturalHeight={preview.height}
                  dragHint={t.dragHint}
                  onTransformChange={handleTransformChange}
                />

                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-xs font-medium text-zinc-600 sm:text-sm">{t.zoom}</span>
                    <button
                      type="button"
                      className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 sm:flex sm:h-9 sm:w-9"
                      onClick={() => editorRef.current?.zoomOut()}
                    >
                      <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <input
                        type="range"
                        min={100}
                        max={300}
                        step={1}
                        value={zoomPercent}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          setZoomPercent(next);
                          editorRef.current?.setZoomPercent(next);
                        }}
                        className={cn(
                          "box-border h-1.5 w-full max-w-full min-w-0 cursor-pointer appearance-none rounded-full bg-zinc-200 sm:h-2",
                          "[&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none sm:[&::-webkit-slider-thumb]:h-3.5 sm:[&::-webkit-slider-thumb]:w-3.5",
                          "[&::-webkit-slider-thumb]:rotate-45 [&::-webkit-slider-thumb]:rounded-[2px] [&::-webkit-slider-thumb]:bg-violet-600",
                          "[&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 sm:[&::-moz-range-thumb]:h-3.5 sm:[&::-moz-range-thumb]:w-3.5",
                          "[&::-moz-range-thumb]:rotate-45 [&::-moz-range-thumb]:rounded-[2px] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-violet-600"
                        )}
                        style={{
                          background: `linear-gradient(to right, rgb(124 58 237) 0%, rgb(124 58 237) ${((zoomPercent - 100) / 200) * 100}%, rgb(228 228 231) ${((zoomPercent - 100) / 200) * 100}%, rgb(228 228 231) 100%)`
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 sm:flex sm:h-9 sm:w-9"
                      onClick={() => editorRef.current?.zoomIn()}
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-zinc-700 sm:w-12 sm:text-sm">
                      {zoomPercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
                      onClick={() => {
                        editorRef.current?.reset();
                        setZoomPercent(100);
                      }}
                    >
                      <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {t.reset}
                    </button>
                  </div>
                  <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-zinc-400 sm:hidden">
                    <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{t.privacy}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-row gap-2.5 border-t border-zinc-100 bg-white px-4 py-3 sm:items-center sm:justify-end sm:gap-3 sm:bg-zinc-50/60 sm:px-8 sm:py-5">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl border-zinc-200 bg-white text-sm font-semibold sm:h-11 sm:min-w-[120px] sm:flex-none sm:w-auto"
              onClick={onCancel}
              disabled={busy}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              className="h-10 flex-1 rounded-xl bg-violet-600 text-sm font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.24)] hover:bg-violet-700 sm:h-11 sm:min-w-[140px] sm:flex-none sm:w-auto"
              onClick={() => void handleConfirm()}
              disabled={busy || !cropState || Boolean(loadError)}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {busy ? t.processing : t.confirm}
            </Button>
          </div>
        </div>

        <p className="mt-3 hidden shrink-0 items-center justify-center gap-1.5 px-2 text-center text-xs text-zinc-400 sm:flex">
          <Lock className="h-3.5 w-3.5" />
          {t.privacy}
        </p>
      </DialogContent>
    </Dialog>
  );
}
