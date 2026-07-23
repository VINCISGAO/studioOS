"use client";

import { useState } from "react";
import { ImagePlus, MousePointer2, Paperclip, X } from "lucide-react";
import type { GenerationReference } from "@/lib/canvas/generation-ui";
import { generationPanelImageReferenceClass } from "@/lib/canvas/generation-panel-design";
import type { Locale } from "@/lib/i18n";

export function GenerationImageReferenceSlot({
  locale,
  reference,
  onLocalUpload,
  onCanvasPick,
  onClear
}: {
  locale: Locale;
  reference: GenerationReference | null;
  onLocalUpload: () => void;
  onCanvasPick: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (reference) {
    return (
      <div className="relative shrink-0">
        <div className="h-20 w-20 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reference.url} alt={reference.fileName} className="h-full w-full object-cover" />
        </div>
        <button
          type="button"
          onClick={onClear}
          className="absolute -right-1 -top-1 rounded-full bg-zinc-900 p-1 text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={generationPanelImageReferenceClass}
      >
        <ImagePlus className="h-5 w-5" />
        <span className="text-[10px] text-zinc-500">{locale === "zh" ? "参考图" : "Reference"}</span>
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-44 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50"
            onClick={() => {
              setOpen(false);
              onLocalUpload();
            }}
          >
            <Paperclip className="h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-800">
              {locale === "zh" ? "从本地上传图片" : "Upload from local"}
            </span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50"
            onClick={() => {
              setOpen(false);
              onCanvasPick();
            }}
          >
            <MousePointer2 className="h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-800">
              {locale === "zh" ? "从画布选择" : "Select from canvas"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
