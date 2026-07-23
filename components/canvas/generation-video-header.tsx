"use client";

import { Shield } from "lucide-react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import { GenerationUploadMenu } from "@/components/canvas/generation-upload-menu";
import {
  VIDEO_PANEL_HEADER_ROW,
  VIDEO_PANEL_NOTICE,
  videoPanelUploadButtonClass
} from "@/lib/canvas/generation-video-panel-design";
import type { Locale } from "@/lib/i18n";

const copy = {
  zh: { hint: "角色素材需通过素材库审核后方可使用" },
  en: { hint: "Character assets must pass library review before use" }
} as const;

export function GenerationVideoHeader({
  locale,
  referenceSlot,
  uploadOpen,
  onUploadToggle,
  onLocalUpload,
  onOpenLibrary,
  onOpenCanvasPicker
}: {
  locale: Locale;
  referenceSlot: GenerationReferenceSlot;
  uploadOpen: boolean;
  onUploadToggle: () => void;
  onLocalUpload: () => void;
  onOpenLibrary: () => void;
  onOpenCanvasPicker: () => void;
}) {
  const t = copy[locale];

  return (
    <div className={VIDEO_PANEL_HEADER_ROW}>
      <p className={VIDEO_PANEL_NOTICE}>
        <Shield className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        {t.hint}
      </p>
      <GenerationUploadMenu
        locale={locale}
        slot={referenceSlot}
        open={uploadOpen}
        buttonClassName={videoPanelUploadButtonClass}
        onToggle={onUploadToggle}
        onLocalUpload={onLocalUpload}
        onOpenLibrary={onOpenLibrary}
        onOpenCanvasPicker={onOpenCanvasPicker}
      />
    </div>
  );
}
