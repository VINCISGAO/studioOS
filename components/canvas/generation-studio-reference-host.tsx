"use client";

import { LoaderCircle } from "lucide-react";
import type { RefObject } from "react";
import { GenerationAssetLibraryModal } from "@/components/canvas/generation-asset-library-modal";
import { GenerationCanvasPickerModal } from "@/components/canvas/generation-canvas-picker-modal";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import type { GenerationReference } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import type { VincisCanvasNode } from "@/lib/canvas/types";

export function GenerationStudioReferenceHost({
  locale,
  projectId,
  nodes,
  reference,
  showAssetLibrary,
  showCanvasPicker,
  canvasPickerSlot,
  uploadingReference,
  localInputRef,
  onReferenceChange,
  onCloseAssetLibrary,
  onCloseCanvasPicker,
  onLocalFileSelected,
  onUploadReference
}: {
  locale: Locale;
  projectId: string;
  nodes: VincisCanvasNode[];
  reference: GenerationReference | null;
  showAssetLibrary: boolean;
  showCanvasPicker: boolean;
  canvasPickerSlot: GenerationReferenceSlot;
  uploadingReference: boolean;
  localInputRef: RefObject<HTMLInputElement | null>;
  onReferenceChange: (reference: GenerationReference | null) => void;
  onCloseAssetLibrary: () => void;
  onCloseCanvasPicker: () => void;
  onLocalFileSelected: (file: File) => Promise<void>;
  onUploadReference: (file: File) => Promise<GenerationReference>;
}) {
  return (
    <>
      <input
        ref={localInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
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
        open={showAssetLibrary}
        selectedId={reference?.assetId}
        onClose={onCloseAssetLibrary}
        onSelect={onReferenceChange}
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
            {locale === "zh" ? "正在上传参考图…" : "Uploading reference…"}
          </div>
        </div>
      ) : null}
    </>
  );
}
