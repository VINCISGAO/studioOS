"use client";

import type { DragEvent, RefObject } from "react";
import { useState } from "react";
import { Check, Plus, UploadCloud, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { formatUploadBytes } from "@/lib/studioos/reviewer-version-upload-client";
import { cn } from "@/lib/utils";

export type ReviewerVersionUploadPhase = "idle" | "uploading" | "processing";

export type ReviewerVersionUploadUI = {
  phase: ReviewerVersionUploadPhase;
  progress: number;
  loadedBytes: number;
  totalBytes: number;
};

const copy = {
  zh: {
    upload: "上传新版本",
    formats: "MP4 / MOV",
    maxSize: "最大 500MB",
    drag: "拖拽视频到这里",
    or: "或",
    click: "点击上传",
    uploading: "上传中…",
    cancel: "取消",
    uploadDone: "上传完成",
    thumbnails: "正在生成缩略图…",
    eta: "预计10秒"
  },
  en: {
    upload: "Upload version",
    formats: "MP4 / MOV",
    maxSize: "Up to 500 MB",
    drag: "Drop video here",
    or: "or",
    click: "Click to upload",
    uploading: "Uploading…",
    cancel: "Cancel",
    uploadDone: "Upload complete",
    thumbnails: "Generating thumbnails…",
    eta: "~10 sec"
  }
};

export function ReviewerVersionUploadZone({
  locale,
  variant = "compact",
  uploadLabel,
  panelTitle,
  panelSubtitle,
  inputId,
  fileRef,
  uploadUI,
  disabled = false,
  onFileInputChange,
  onUploadFile,
  onCancelUpload,
  onOpenPicker
}: {
  locale: Locale;
  variant?: "compact" | "panel";
  uploadLabel?: string;
  panelTitle?: string;
  panelSubtitle?: string;
  inputId: string;
  fileRef: RefObject<HTMLInputElement | null>;
  uploadUI: ReviewerVersionUploadUI;
  disabled?: boolean;
  onFileInputChange: () => void;
  onUploadFile: (file: File) => void;
  onCancelUpload: () => void;
  onOpenPicker: () => void;
}) {
  const t = copy[locale];
  const [dragActive, setDragActive] = useState(false);
  const busy = uploadUI.phase !== "idle" || disabled;

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (busy) return;
    setDragActive(true);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragActive(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onUploadFile(file);
  }

  function openPicker() {
    if (busy) return;
    onOpenPicker();
  }

  if (uploadUI.phase === "uploading") {
    return (
      <UploadProgressCard
        variant={variant}
        title={t.uploading}
        progress={uploadUI.progress}
        loadedBytes={uploadUI.loadedBytes}
        totalBytes={uploadUI.totalBytes}
        cancelLabel={t.cancel}
        onCancel={onCancelUpload}
      />
    );
  }

  if (uploadUI.phase === "processing") {
    return (
      <UploadProgressCard
        variant={variant}
        title={t.uploadDone}
        subtitle={t.thumbnails}
        eta={t.eta}
        progress={uploadUI.progress}
        doneIcon
      />
    );
  }

  return (
    <>
      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept="video/mp4,video/quicktime,.mov,.mp4"
        className="hidden"
        disabled={disabled}
        onChange={onFileInputChange}
      />
      {variant === "compact" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={openPicker}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "flex min-w-[148px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition",
            dragActive
              ? "border-violet-400 bg-violet-50"
              : "border-zinc-300 bg-zinc-50/80 hover:border-violet-300 hover:bg-violet-50/40",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <Plus className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
          <span className="text-xs font-medium text-zinc-700">{uploadLabel ?? t.upload}</span>
          <span className="text-[10px] text-zinc-400">{t.formats}</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={openPicker}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center transition",
            dragActive
              ? "border-violet-400 bg-violet-50"
              : "border-zinc-300 bg-zinc-50/80 hover:border-violet-300 hover:bg-violet-50/40",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <UploadCloud className="h-6 w-6 text-violet-600" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-zinc-900">{uploadLabel ?? t.upload}</p>
            {panelTitle ? <p className="text-xs font-medium text-zinc-600">{panelTitle}</p> : null}
            <p className="text-xs text-zinc-500">
              {panelSubtitle ?? `${t.or} ${t.click}`}
            </p>
          </div>
          {!panelSubtitle ? (
            <p className="text-[11px] text-zinc-400">
              {t.formats} · {t.maxSize}
            </p>
          ) : null}
        </button>
      )}
    </>
  );
}

function UploadProgressCard({
  variant,
  title,
  subtitle,
  eta,
  progress,
  loadedBytes,
  totalBytes,
  cancelLabel,
  doneIcon = false,
  onCancel
}: {
  variant: "compact" | "panel";
  title: string;
  subtitle?: string;
  eta?: string;
  progress: number;
  loadedBytes?: number;
  totalBytes?: number;
  cancelLabel?: string;
  doneIcon?: boolean;
  onCancel?: () => void;
}) {
  const showBytes =
    typeof loadedBytes === "number" &&
    typeof totalBytes === "number" &&
    totalBytes > 0 &&
    !doneIcon;

  return (
    <div
      className={cn(
        "shrink-0 rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-4 text-left",
        variant === "compact" ? "min-w-[200px]" : "w-full"
      )}
    >
      <div className="flex items-start gap-2">
        {doneIcon ? (
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-zinc-900">{title}</p>
          {subtitle ? <p className="mt-0.5 text-[11px] text-zinc-600">{subtitle}</p> : null}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100">
            <div
              className="h-full rounded-full bg-violet-600 transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
            {showBytes ? (
              <span className="tabular-nums">
                {formatUploadBytes(loadedBytes)} / {formatUploadBytes(totalBytes)}
              </span>
            ) : eta ? (
              <span>{eta}</span>
            ) : (
              <span />
            )}
            <span className="tabular-nums font-medium text-violet-700">{progress}%</span>
          </div>
        </div>
        {onCancel && cancelLabel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-zinc-600 hover:bg-white/80"
          >
            <X className="h-3 w-3" />
            {cancelLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
