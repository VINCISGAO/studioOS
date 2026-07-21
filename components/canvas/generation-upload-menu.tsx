"use client";

import { Paperclip, PlusSquare, Upload, UserPlus } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const copy = {
  zh: {
    upload: "上传",
    localUpload: "从本地上传图片",
    library: "从素材库选择",
    libraryHint: "角色素材需通过素材库审核后方可使用",
    canvas: "从画布选择"
  },
  en: {
    upload: "Upload",
    localUpload: "Upload image from local",
    library: "Select from asset library",
    libraryHint: "Character assets must pass library review before use",
    canvas: "Select from canvas"
  }
} as const;

export function GenerationUploadMenu({
  locale,
  open,
  onToggle,
  onLocalUpload,
  onOpenLibrary,
  onOpenCanvasPicker
}: {
  locale: Locale;
  open: boolean;
  onToggle: () => void;
  onLocalUpload: () => void;
  onOpenLibrary: () => void;
  onOpenCanvasPicker: () => void;
}) {
  const t = copy[locale];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        <Upload className="h-4 w-4" />
        {t.upload}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl">
          <button
            type="button"
            className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50"
            onClick={onLocalUpload}
          >
            <Paperclip className="mt-0.5 h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-800">{t.localUpload}</span>
          </button>
          <button
            type="button"
            className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50"
            onClick={onOpenLibrary}
          >
            <UserPlus className="mt-0.5 h-4 w-4 text-zinc-500" />
            <div>
              <div className="text-sm text-zinc-800">{t.library}</div>
              <div className="mt-0.5 text-[11px] leading-4 text-zinc-400">{t.libraryHint}</div>
            </div>
          </button>
          <button
            type="button"
            className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50"
            onClick={onOpenCanvasPicker}
          >
            <PlusSquare className="mt-0.5 h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-800">{t.canvas}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
