"use client";

import { useRef, useState } from "react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import type { CanvasAssetLibraryKind } from "@/lib/canvas/canvas-library-kind";
import { canvasLibraryKindFromReferenceSlot } from "@/lib/canvas/canvas-library-kind";
import { enrichCanvasGenerationReference } from "@/lib/canvas/canvas-preview-asset-id";
import type { GenerationReference } from "@/lib/canvas/generation-ui";

export type GenerationReferenceTarget = "primary" | "lastFrame";

async function uploadReference(
  projectId: string,
  file: File,
  target: "library" | "reference" = "reference",
  libraryKind?: CanvasAssetLibraryKind
): Promise<GenerationReference> {
  const formData = new FormData();
  formData.set("projectId", projectId);
  formData.set("file", file);
  formData.set("target", target);
  if (target === "library" && libraryKind) {
    formData.set("kind", libraryKind);
  }
  const response = await fetch("/api/canvas/assets", { method: "POST", body: formData });
  const payload = (await response.json()) as {
    success: boolean;
    data?: {
      id: string;
      fileName: string;
      mimeType: string;
      url: string;
      reviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
      reviewReasons?: string[];
      selectable?: boolean;
    };
    error?: { message?: string };
  };
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? "Upload failed");
  }
  return {
    url: payload.data.url,
    assetId: payload.data.id,
    fileName: payload.data.fileName,
    mimeType: payload.data.mimeType,
    source: target === "library" ? ("library" as const) : ("local" as const),
    reviewStatus: payload.data.reviewStatus,
    reviewReasons: payload.data.reviewReasons,
    selectable: payload.data.selectable
  };
}

const acceptBySlot: Record<GenerationReferenceSlot, string> = {
  video: "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm",
  image: "image/jpeg,image/png,image/webp,image/gif",
  audio: "audio/mpeg,audio/wav,.mp3,.wav"
};

const keyframeAccept = acceptBySlot.image;

export function useGenerationStudioReferences(projectId: string) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const [reference, setReference] = useState<GenerationReference | null>(null);
  const [lastFrameReference, setLastFrameReference] = useState<GenerationReference | null>(null);
  const [referenceTarget, setReferenceTarget] = useState<GenerationReferenceTarget>("primary");
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [showCanvasPicker, setShowCanvasPicker] = useState(false);
  const [assetLibrarySlot, setAssetLibrarySlot] = useState<GenerationReferenceSlot>("video");
  const [canvasPickerSlot, setCanvasPickerSlot] = useState<GenerationReferenceSlot>("video");
  const [uploadingReference, setUploadingReference] = useState(false);
  const [librarySelections, setLibrarySelections] = useState<GenerationReference[]>([]);

  function referenceKey(entry: GenerationReference) {
    return entry.assetId ?? entry.url;
  }

  function assignReference(next: GenerationReference | null, target = referenceTarget) {
    const enriched = next ? enrichCanvasGenerationReference(next) : null;
    if (target === "lastFrame") {
      setLastFrameReference(enriched);
      return;
    }
    setReference(enriched);
  }

  function upsertLibrarySelection(next: GenerationReference) {
    const enriched = enrichCanvasGenerationReference(next);
    setLibrarySelections((current) => {
      const key = referenceKey(enriched);
      if (current.some((item) => referenceKey(item) === key)) return current;
      return [...current, enriched];
    });
    assignReference(enriched);
  }

  function toggleLibrarySelection(next: GenerationReference) {
    const enriched = enrichCanvasGenerationReference(next);
    const key = referenceKey(enriched);
    setLibrarySelections((current) => {
      const exists = current.some((item) => referenceKey(item) === key);
      if (exists) {
        const filtered = current.filter((item) => referenceKey(item) !== key);
        setReference((active) => {
          if (!active || referenceKey(active) !== key) return active;
          return filtered[filtered.length - 1] ?? null;
        });
        return filtered;
      }
      assignReference(enriched);
      return [...current, enriched];
    });
  }

  function removeLibrarySelection(key: string) {
    setLibrarySelections((current) => current.filter((item) => referenceKey(item) !== key));
    if (reference && referenceKey(reference) === key) {
      setReference((current) => {
        if (!current || referenceKey(current) !== key) return current;
        return null;
      });
    }
  }

  function activateLibrarySelection(next: GenerationReference) {
    assignReference(enrichCanvasGenerationReference(next));
  }

  function pickLocalReference(slot: GenerationReferenceSlot, target: GenerationReferenceTarget = "primary") {
    setReferenceTarget(target);
    localInputRef.current?.setAttribute(
      "accept",
      target === "lastFrame" ? keyframeAccept : acceptBySlot[slot]
    );
    localInputRef.current?.click();
  }

  function openReferenceLibrary(slot: GenerationReferenceSlot, target: GenerationReferenceTarget = "primary") {
    setReferenceTarget(target);
    setAssetLibrarySlot(target === "lastFrame" ? "image" : slot);
    setShowAssetLibrary(true);
  }

  function openReferenceCanvasPicker(
    slot: GenerationReferenceSlot,
    target: GenerationReferenceTarget = "primary"
  ) {
    setReferenceTarget(target);
    setCanvasPickerSlot(target === "lastFrame" ? "image" : slot);
    setShowCanvasPicker(true);
  }

  async function handleLocalFile(file: File) {
    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    const isAudioReference =
      file.type.startsWith("audio/") || extension === "mp3" || extension === "wav";
    if (isAudioReference && extension !== "mp3" && extension !== "wav") {
      return;
    }
    setUploadingReference(true);
    try {
      const uploaded = await uploadReference(projectId, file);
      assignReference(uploaded, referenceTarget);
    } finally {
      setUploadingReference(false);
    }
  }

  return {
    localInputRef,
    reference,
    setReference,
    lastFrameReference,
    setLastFrameReference,
    referenceTarget,
    setReferenceTarget,
    assignReference,
    librarySelections,
    upsertLibrarySelection,
    toggleLibrarySelection,
    removeLibrarySelection,
    activateLibrarySelection,
    showAssetLibrary,
    setShowAssetLibrary,
    showCanvasPicker,
    setShowCanvasPicker,
    assetLibrarySlot,
    canvasPickerSlot,
    uploadingReference,
    pickLocalReference,
    openReferenceLibrary,
    openReferenceCanvasPicker,
    handleLocalFile,
    uploadReference: (file: File) => uploadReference(projectId, file, "reference"),
    uploadLibraryAsset: (file: File, kind?: CanvasAssetLibraryKind) =>
      uploadReference(
        projectId,
        file,
        "library",
        kind ?? canvasLibraryKindFromReferenceSlot(assetLibrarySlot)
      )
  };
}
