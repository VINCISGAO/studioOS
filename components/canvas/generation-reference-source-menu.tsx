"use client";

import { MousePointer2, Paperclip, UserPlus } from "lucide-react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    localUploadVideo: "从本地上传视频",
    localUploadImage: "从本地上传图片",
    localUploadAudio: "从本地上传 MP3/WAV",
    library: "从素材库选择",
    libraryHint: "角色素材需通过素材库审核后方可使用",
    canvas: "从画布选择"
  },
  en: {
    localUploadVideo: "Upload video from local",
    localUploadImage: "Upload image from local",
    localUploadAudio: "Upload MP3/WAV from local",
    library: "Select from asset library",
    libraryHint: "Character assets must pass library review before use",
    canvas: "Select from canvas"
  }
} as const;

export function localReferenceUploadLabel(slot: GenerationReferenceSlot, locale: Locale) {
  const t = copy[locale];
  if (slot === "video") return t.localUploadVideo;
  if (slot === "audio") return t.localUploadAudio;
  return t.localUploadImage;
}

export function GenerationReferenceSourceMenu({
  locale,
  slot,
  className,
  showLibraryHint = true,
  onLocalUpload,
  onOpenLibrary,
  onOpenCanvasPicker,
  onActionComplete
}: {
  locale: Locale;
  slot: GenerationReferenceSlot;
  className?: string;
  showLibraryHint?: boolean;
  onLocalUpload: () => void;
  onOpenLibrary: () => void;
  onOpenCanvasPicker: () => void;
  onActionComplete?: () => void;
}) {
  const t = copy[locale];

  function run(action: () => void) {
    onActionComplete?.();
    action();
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl",
        className
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50"
        onClick={() => run(onLocalUpload)}
      >
        <Paperclip className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <span className="text-sm text-zinc-800">{localReferenceUploadLabel(slot, locale)}</span>
      </button>
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50"
        onClick={() => run(onOpenLibrary)}
      >
        <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <div className="min-w-0">
          <div className="text-sm text-zinc-800">{t.library}</div>
          {showLibraryHint ? (
            <div className="mt-0.5 text-[11px] leading-4 text-zinc-400">{t.libraryHint}</div>
          ) : null}
        </div>
      </button>
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50"
        onClick={() => run(onOpenCanvasPicker)}
      >
        <MousePointer2 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        <span className="text-sm text-zinc-800">{t.canvas}</span>
      </button>
    </div>
  );
}
