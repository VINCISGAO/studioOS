"use client";

import { useCallback, useRef, useState } from "react";

export type CanvasChatReference = {
  assetId: string;
  url: string;
  fileName: string;
};

async function uploadReference(projectId: string, file: File): Promise<CanvasChatReference> {
  const formData = new FormData();
  formData.set("projectId", projectId);
  formData.set("file", file);
  formData.set("target", "reference");
  const response = await fetch("/api/canvas/assets", { method: "POST", body: formData });
  const payload = (await response.json()) as {
    success: boolean;
    data?: { id: string; fileName: string; url: string };
    error?: { message?: string };
  };
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? "Upload failed");
  }
  return {
    assetId: payload.data.id,
    url: payload.data.url,
    fileName: payload.data.fileName
  };
}

export function useCanvasChatReference(projectId: string) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reference, setReference] = useState<CanvasChatReference | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickReference() {
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      setReference(await uploadReference(projectId, file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function clearReference() {
    setReference(null);
    setError(null);
  }

  const setReferenceFromCanvas = useCallback((payload: CanvasChatReference) => {
    setReference(payload);
    setError(null);
  }, []);

  return {
    inputRef,
    reference,
    uploading,
    error,
    pickReference,
    handleFile,
    clearReference,
    setReferenceFromCanvas,
    clearAll: () => {
      clearReference();
    }
  };
}
