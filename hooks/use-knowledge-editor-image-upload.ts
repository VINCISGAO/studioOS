"use client";

import { uploadKnowledgeImage } from "@/lib/knowledge/knowledge-upload-client";
import { useCallback, useRef, useState } from "react";

type UploadResult = { url: string; fallback_url?: string };

export function useKnowledgeEditorImageUpload(kind: "cover" | "inline", zh = false) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setUploading(false);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setUploading(true);
      setError(null);
      try {
        const result = await uploadKnowledgeImage(file, kind, zh, { signal: controller.signal });
        abortRef.current = null;
        setUploading(false);
        return result;
      } catch (uploadError) {
        if (controller.signal.aborted) {
          setUploading(false);
          throw uploadError;
        }
        const message = uploadError instanceof Error ? uploadError.message : zh ? "上传失败" : "Upload failed";
        abortRef.current = null;
        setUploading(false);
        setError(message);
        throw new Error(message);
      }
    },
    [kind, zh]
  );

  return { uploading, error, upload, cancel };
}
