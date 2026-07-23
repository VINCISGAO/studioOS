"use client";

import { useRef, useState } from "react";
import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";
import type { GenerationReference } from "@/lib/canvas/generation-ui";

async function uploadReference(
  projectId: string,
  file: File,
  target: "library" | "reference" = "reference"
): Promise<GenerationReference> {
  const formData = new FormData();
  formData.set("projectId", projectId);
  formData.set("file", file);
  formData.set("target", target);
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

export function useGenerationStudioReferences(projectId: string) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const [reference, setReference] = useState<GenerationReference | null>(null);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [showCanvasPicker, setShowCanvasPicker] = useState(false);
  const [assetLibrarySlot, setAssetLibrarySlot] = useState<GenerationReferenceSlot>("video");
  const [canvasPickerSlot, setCanvasPickerSlot] = useState<GenerationReferenceSlot>("video");
  const [uploadingReference, setUploadingReference] = useState(false);

  function pickLocalReference(slot: GenerationReferenceSlot) {
    localInputRef.current?.setAttribute("accept", acceptBySlot[slot]);
    localInputRef.current?.click();
  }

  function openReferenceLibrary(slot: GenerationReferenceSlot) {
    setAssetLibrarySlot(slot);
    setShowAssetLibrary(true);
  }

  function openReferenceCanvasPicker(slot: GenerationReferenceSlot) {
    setCanvasPickerSlot(slot);
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
      setReference(await uploadReference(projectId, file));
    } finally {
      setUploadingReference(false);
    }
  }

  return {
    localInputRef,
    reference,
    setReference,
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
    uploadLibraryAsset: (file: File) => uploadReference(projectId, file, "library")
  };
}
