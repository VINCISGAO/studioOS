"use client";

import { GenerationUploadMenu } from "@/components/canvas/generation-upload-menu";
import type { Locale } from "@/lib/i18n";

const copy = {
  zh: { hint: "角色素材需通过素材库审核后方可使用" },
  en: { hint: "Character assets must pass library review before use" }
} as const;

export function GenerationVideoHeader({
  locale,
  uploadOpen,
  onUploadToggle,
  onLocalUpload,
  onOpenLibrary,
  onOpenCanvasPicker
}: {
  locale: Locale;
  uploadOpen: boolean;
  onUploadToggle: () => void;
  onLocalUpload: () => void;
  onOpenLibrary: () => void;
  onOpenCanvasPicker: () => void;
}) {
  const t = copy[locale];

  return (
    <div className="flex items-start justify-between gap-2 px-3 pt-3">
      <p className="max-w-[72%] text-[11px] leading-4 text-zinc-400">{t.hint}</p>
      <GenerationUploadMenu
        locale={locale}
        open={uploadOpen}
        onToggle={onUploadToggle}
        onLocalUpload={onLocalUpload}
        onOpenLibrary={onOpenLibrary}
        onOpenCanvasPicker={onOpenCanvasPicker}
      />
    </div>
  );
}
