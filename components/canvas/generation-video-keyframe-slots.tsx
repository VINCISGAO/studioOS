"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { GenerationReferenceSourceMenu } from "@/components/canvas/generation-reference-source-menu";
import type { GenerationReference } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    first: "首帧",
    last: "尾帧"
  },
  en: {
    first: "First frame",
    last: "Last frame"
  }
} as const;

function KeyframeSlot({
  locale,
  label,
  reference,
  onLocalUpload,
  onOpenLibrary,
  onCanvasPick,
  onClear
}: {
  locale: Locale;
  label: string;
  reference: GenerationReference | null;
  onLocalUpload: () => void;
  onOpenLibrary: () => void;
  onCanvasPick: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (reference) {
    return (
      <div className="relative min-w-0 flex-1">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reference.url} alt={reference.fileName} className="h-24 w-full object-cover" />
        </div>
        <div className="mt-1 text-[11px] font-medium text-zinc-700">{label}</div>
        <button
          type="button"
          onClick={onClear}
          className="absolute right-1 top-1 rounded-full bg-zinc-900 p-1 text-white"
          aria-label={locale === "zh" ? `移除${label}` : `Remove ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-200 bg-white text-[#8B5CF6] transition hover:border-[#8B5CF6]/40 hover:bg-[#FBFAFF]"
      >
        <ImagePlus className="h-5 w-5" />
        <span className="text-[11px] font-medium text-zinc-700">{label}</span>
      </button>
      {open ? (
        <GenerationReferenceSourceMenu
          locale={locale}
          slot="image"
          className="absolute bottom-full left-0 z-50 mb-2 w-52"
          showLibraryHint={false}
          onLocalUpload={onLocalUpload}
          onOpenLibrary={onOpenLibrary}
          onOpenCanvasPicker={onCanvasPick}
          onActionComplete={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function GenerationVideoKeyframeSlots({
  locale,
  firstFrame,
  lastFrame,
  onPickFirstLocal,
  onPickFirstLibrary,
  onPickFirstCanvas,
  onPickLastLocal,
  onPickLastLibrary,
  onPickLastCanvas,
  onClearFirst,
  onClearLast
}: {
  locale: Locale;
  firstFrame: GenerationReference | null;
  lastFrame: GenerationReference | null;
  onPickFirstLocal: () => void;
  onPickFirstLibrary: () => void;
  onPickFirstCanvas: () => void;
  onPickLastLocal: () => void;
  onPickLastLibrary: () => void;
  onPickLastCanvas: () => void;
  onClearFirst: () => void;
  onClearLast: () => void;
}) {
  const t = copy[locale];

  return (
    <div className="mt-3">
      <div className="mb-2 text-[11px] text-zinc-500">
        {locale === "zh" ? "上传首帧与尾帧图片" : "Upload first and last frame images"}
      </div>
      <div className={cn("grid grid-cols-2 gap-2")}>
        <KeyframeSlot
          locale={locale}
          label={t.first}
          reference={firstFrame}
          onLocalUpload={onPickFirstLocal}
          onOpenLibrary={onPickFirstLibrary}
          onCanvasPick={onPickFirstCanvas}
          onClear={onClearFirst}
        />
        <KeyframeSlot
          locale={locale}
          label={t.last}
          reference={lastFrame}
          onLocalUpload={onPickLastLocal}
          onOpenLibrary={onPickLastLibrary}
          onCanvasPick={onPickLastCanvas}
          onClear={onClearLast}
        />
      </div>
    </div>
  );
}
