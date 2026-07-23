"use client";

import { Upload } from "lucide-react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { GenerationReferenceSourceMenu } from "@/components/canvas/generation-reference-source-menu";
import type { Locale } from "@/lib/i18n";

const copy = {
  zh: { upload: "上传" },
  en: { upload: "Upload" }
} as const;

export function GenerationUploadMenu({
  locale,
  slot,
  open,
  buttonClassName,
  onToggle,
  onLocalUpload,
  onOpenLibrary,
  onOpenCanvasPicker
}: {
  locale: Locale;
  slot: GenerationReferenceSlot;
  open: boolean;
  buttonClassName?: string;
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
        className={
          buttonClassName ??
          "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-sm text-zinc-700 hover:bg-zinc-50"
        }
      >
        <Upload className="h-4 w-4" />
        {t.upload}
      </button>
      {open ? (
        <GenerationReferenceSourceMenu
          locale={locale}
          slot={slot}
          className="absolute right-0 top-full z-50 mt-2 w-56"
          onLocalUpload={onLocalUpload}
          onOpenLibrary={onOpenLibrary}
          onOpenCanvasPicker={onOpenCanvasPicker}
          onActionComplete={onToggle}
        />
      ) : null}
    </div>
  );
}
