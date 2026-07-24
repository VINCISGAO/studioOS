"use client";

import { LoaderCircle } from "lucide-react";
import type { RefObject } from "react";
import {
  GenerationAssetLibraryModal,
  generationAssetLibraryKindFromSlot
} from "@/components/canvas/generation-asset-library-modal";
import { GenerationCanvasPickerModal } from "@/components/canvas/generation-canvas-picker-modal";
import type { GenerationReferenceTarget } from "@/components/canvas/hooks/use-generation-studio-references";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import type { GenerationReference } from "@/lib/canvas/generation-ui";
import type { CanvasAssetLibraryKind } from "@/lib/canvas/canvas-library-kind";
import type { Locale } from "@/lib/i18n";
import type { VincisCanvasNode } from "@/lib/canvas/types";

const acceptBySlot: Record<GenerationReferenceSlot, string> = {
  video: "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm",
  image: "image/jpeg,image/png,image/webp,image/gif",
  audio: "audio/mpeg,audio/wav,.mp3,.wav"
};

const uploadCopy = {
  zh: {
    video: "正在上传参考视频…",
    image: "正在上传参考图…",
    audio: "正在上传参考音频…"
  },
  en: {
    video: "Uploading reference video…",
    image: "Uploading reference image…",
    audio: "Uploading reference audio…"
  }
} as const;

export function GenerationStudioReferenceHost({
  locale,
  projectId,
  nodes,
  reference,
  lastFrameReference,
  librarySelections,
  referenceTarget,
  showAssetLibrary,
  assetLibrarySlot,
  showCanvasPicker,
  canvasPickerSlot,
  uploadingReference,
  localInputRef,
  onReferenceChange,
  onLibrarySelectionsChange,
  onCloseAssetLibrary,
  onCloseCanvasPicker,
  onLocalFileSelected,
  onUploadReference
}: {
  locale: Locale;
  projectId: string;
  nodes: VincisCanvasNode[];
  reference: GenerationReference | null;
  lastFrameReference: GenerationReference | null;
  librarySelections: GenerationReference[];
  referenceTarget: GenerationReferenceTarget;
  showAssetLibrary: boolean;
  assetLibrarySlot: GenerationReferenceSlot;
  showCanvasPicker: boolean;
  canvasPickerSlot: GenerationReferenceSlot;
  uploadingReference: boolean;
  localInputRef: RefObject<HTMLInputElement | null>;
  onReferenceChange: (reference: GenerationReference | null) => void;
  onLibrarySelectionsChange: (references: GenerationReference[]) => void;
  onCloseAssetLibrary: () => void;
  onCloseCanvasPicker: () => void;
  onLocalFileSelected: (file: File) => Promise<void>;
  onUploadReference: (file: File, libraryKind: CanvasAssetLibraryKind) => Promise<GenerationReference>;
}) {
  const selectedReference =
    referenceTarget === "lastFrame" ? lastFrameReference : reference;
  const uploadSlot = referenceTarget === "lastFrame" ? "image" : assetLibrarySlot;
  const multiSelect = referenceTarget === "primary";
  const selectedLibraryAssetIds = [
    ...new Set(
      [
        ...librarySelections.map((item) => item.assetId),
        selectedReference?.source === "library" ? selectedReference.assetId : null
      ].filter((id): id is string => Boolean(id))
    )
  ];

  return (
    <>
      <input
        ref={localInputRef}
        type="file"
        className="sr-only"
        accept={acceptBySlot[uploadSlot]}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          await onLocalFileSelected(file);
        }}
      />

      <GenerationAssetLibraryModal
        locale={locale}
        projectId={projectId}
        libraryKind={generationAssetLibraryKindFromSlot(assetLibrarySlot)}
        open={showAssetLibrary}
        selectedId={selectedReference?.assetId}
        selectedIds={selectedLibraryAssetIds}
        multiSelect={multiSelect}
        onClose={onCloseAssetLibrary}
        onSelect={(picked) => {
          if (multiSelect) {
            onLibrarySelectionsChange(picked);
            return;
          }
          onReferenceChange(picked[0] ?? null);
        }}
        onUpload={onUploadReference}
      />

      <GenerationCanvasPickerModal
        locale={locale}
        open={showCanvasPicker}
        nodes={nodes}
        filterSlot={canvasPickerSlot}
        onClose={onCloseCanvasPicker}
        onSelect={onReferenceChange}
      />

      {uploadingReference ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-40 z-50 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs text-white">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {uploadCopy[locale][uploadSlot]}
          </div>
        </div>
      ) : null}
    </>
  );
}
