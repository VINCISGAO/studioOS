"use client";

import { useCallback, useRef, useState, type DragEvent, type RefObject } from "react";
import type { Locale } from "@/lib/i18n";
import {
  MAX_DELIVERABLE_VIDEO_BYTES,
  maxDeliverableVideoLabel
} from "@/lib/studioos/deliverable-video-policy-shared";
import { cn } from "@/lib/utils";
import { Plus, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

const copy = {
  en: {
    title: "Upload Version 1",
    subtitle: "Start the brand review flow from here. Every revision uploads from the review center too.",
    dropHint: (limit: string) => `Drag and drop an MP4 here, or click to choose · Max ${limit}`,
    notes: "Version notes (optional)",
    upload: "Upload Version 1",
    invalidType: "Only MP4 videos are supported",
    tooLarge: (limit: string) => `File exceeds ${limit} limit`
  },
  zh: {
    title: "上传 Version 1",
    subtitle: "第一版从审片中心上传；之后的每一版也在这里提交。",
    dropHint: (limit: string) => `拖拽 MP4 到此处，或点击选择文件 · 单文件最大 ${limit}`,
    notes: "版本说明（可选）",
    upload: "上传 Version 1",
    invalidType: "仅支持 MP4 视频",
    tooLarge: (limit: string) => `文件超过 ${limit} 限制`
  }
};

function isMp4File(file: File) {
  const mime = file.type || "application/octet-stream";
  const name = file.name.toLowerCase();
  return mime === "video/mp4" || name.endsWith(".mp4");
}

export function ReviewCenterEmptyUpload({
  locale,
  uploadNotes,
  onUploadNotesChange,
  onUpload,
  pending,
  fileInputRef,
  className
}: {
  locale: Locale;
  uploadNotes: string;
  onUploadNotesChange: (value: string) => void;
  onUpload: (file: File) => void;
  pending: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  const t = copy[locale];
  const limitLabel = maxDeliverableVideoLabel(locale);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const dropZoneRef = useRef<HTMLButtonElement>(null);

  const validateFile = useCallback(
    (file: File | undefined | null) => {
      if (!file?.size) return null;
      if (!isMp4File(file)) return t.invalidType;
      if (file.size > MAX_DELIVERABLE_VIDEO_BYTES) return t.tooLarge(limitLabel);
      return null;
    },
    [limitLabel, t]
  );

  const applyFile = useCallback(
    (file: File | undefined | null) => {
      const validationError = validateFile(file);
      if (validationError) {
        setLocalError(validationError);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setLocalError(null);
      setSelectedFile(file ?? null);
    },
    [fileInputRef, validateFile]
  );

  function openFilePicker() {
    if (pending) return;
    fileInputRef.current?.click();
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0]);
  }

  function handleDragEnter(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setDragActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(event.relatedTarget as Node | null)) {
      setDragActive(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (pending) return;
    applyFile(event.dataTransfer.files?.[0]);
  }

  function handleUploadClick() {
    if (!selectedFile || pending) return;
    onUpload(selectedFile);
  }

  return (
    <div
      className={cn(
        "flex aspect-video flex-col overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50",
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,.mp4"
        className="sr-only"
        disabled={pending}
        onChange={handleInputChange}
      />

      <button
        ref={dropZoneRef}
        type="button"
        disabled={pending}
        onClick={openFilePicker}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
          dragActive ? "border-blue-400 bg-blue-50/60" : "hover:bg-zinc-100/80",
          pending && "cursor-not-allowed opacity-70"
        )}
      >
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition",
            dragActive && "ring-blue-300"
          )}
        >
          <Plus className={cn("h-8 w-8 text-blue-600", dragActive && "scale-110")} />
        </div>
        <div>
          <p className="text-base font-semibold text-zinc-900">{t.title}</p>
          <p className="mt-1 max-w-md text-sm text-zinc-500">{t.subtitle}</p>
          <p className="mt-3 text-xs font-medium text-zinc-500">{t.dropHint(limitLabel)}</p>
          {selectedFile ? (
            <p className="mt-2 text-sm font-medium text-blue-700">{selectedFile.name}</p>
          ) : null}
        </div>
      </button>

      <div
        className="flex w-full flex-col items-stretch gap-2 border-t border-zinc-200 bg-white/80 px-4 py-4 sm:flex-row sm:items-center sm:px-6"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          value={uploadNotes}
          onChange={(event) => onUploadNotesChange(event.target.value)}
          placeholder={t.notes}
          disabled={pending}
          className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-blue-400 disabled:opacity-60"
        />
        <Button
          type="button"
          size="default"
          disabled={pending || !selectedFile}
          onClick={handleUploadClick}
          className="h-10 rounded-lg bg-blue-600 px-5 hover:bg-blue-700"
        >
          <UploadCloud className="h-4 w-4" />
          {t.upload}
        </Button>
      </div>

      {localError ? <p className="px-6 pb-4 text-sm text-red-600">{localError}</p> : null}
    </div>
  );
}
