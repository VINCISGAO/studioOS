"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { StoredProjectReference } from "@/lib/campaign-types";
import type { BrandAssetSlotId } from "@/lib/studioos/brand-creative-brief-options";
import { compressImageForUpload } from "@/lib/studioos/image-upload-client";
import type { Locale } from "@/lib/i18n";

type ImageSlotId = Extract<BrandAssetSlotId, "logo" | "product_photos">;

export type BrandBriefAssetPreviews = Record<BrandAssetSlotId, string | null>;

function productPreviewSrc(url: string) {
  if (url.startsWith("blob:") || url.startsWith("http")) return url;
  return url;
}

function isStoredReferenceVideo(ref: StoredProjectReference) {
  const url = ref.source_url ?? "";
  return (
    url.includes("/api/project-assets/") &&
    (url.includes("reference_video") || ref.type === "mp4")
  );
}

type UploadReferenceVideoResponse = {
  ok: boolean;
  error?: string;
  reference?: StoredProjectReference;
};

function uploadReferenceVideoWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadReferenceVideoResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.set("video_file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
      onProgress(percent);
    });

    xhr.addEventListener("load", () => {
      try {
        const result = JSON.parse(xhr.responseText) as UploadReferenceVideoResponse;
        if (xhr.status >= 200 && xhr.status < 300 && result.ok) {
          onProgress(100);
          resolve(result);
          return;
        }
        reject(new Error(result.error ?? `Upload failed (HTTP ${xhr.status})`));
      } catch {
        reject(
          new Error(
            xhr.status === 413
              ? "Keep reference videos under 200MB"
              : `Reference video upload failed (HTTP ${xhr.status})`
          )
        );
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Reference video upload failed"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Reference video upload cancelled"));
    });

    xhr.open("POST", url);
    xhr.send(fd);
  });
}

export function resolveInitialBrandAssetPreviews(input: {
  productImageUrl?: string | null;
  logoImageUrl?: string | null;
  references?: StoredProjectReference[];
}): BrandBriefAssetPreviews {
  const reference = (input.references ?? []).find(isStoredReferenceVideo);
  return {
    logo: input.logoImageUrl ?? null,
    product_photos: input.productImageUrl ?? null,
    reference_videos: reference?.source_url ?? null
  };
}

async function prepareImageFile(file: File, locale: Locale) {
  const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
  const MAX_REQUEST_SAFE_BYTES = 3.5 * 1024 * 1024;

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(
      locale === "zh"
        ? "图片超过 10MB，请换一张更小的 JPG/PNG 图片"
        : "Image exceeds 10MB — choose a smaller JPG or PNG"
    );
  }

  if (file.size <= MAX_REQUEST_SAFE_BYTES) return file;

  try {
    return await compressImageForUpload(file, {
      maxBytes: MAX_REQUEST_SAFE_BYTES,
      maxDimension: 1600,
      quality: 0.82,
      fileNamePrefix: "brand_asset"
    });
  } catch {
    throw new Error(
      locale === "zh"
        ? "图片较大且浏览器压缩失败，请换一张更小的 JPG/PNG 图片"
        : "This image is large and could not be compressed — choose a smaller JPG or PNG"
    );
  }
}

export function useBrandBriefAssetUploads(input: {
  locale: Locale;
  projectId: string;
  initialPreviews: BrandBriefAssetPreviews;
  onProductUploaded?: (previewUrl: string) => void;
  onReferenceUploaded?: (reference: StoredProjectReference) => void;
  onMediaUpdated?: () => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const referenceVideoInputRef = useRef<HTMLInputElement>(null);
  const referenceImageInputRef = useRef<HTMLInputElement>(null);
  const pendingImageSlotRef = useRef<ImageSlotId>("product_photos");

  const [assetPreviews, setAssetPreviews] = useState(input.initialPreviews);
  const [assetUploadErrors, setAssetUploadErrors] = useState<Partial<Record<BrandAssetSlotId, string>>>({});
  const [uploadingSlot, setUploadingSlot] = useState<BrandAssetSlotId | null>(null);
  const [referenceVideoUploadProgress, setReferenceVideoUploadProgress] = useState<number | null>(null);
  const [productReady, setProductReady] = useState(Boolean(input.initialPreviews.product_photos));
  const [isImageUploading, startImageUpload] = useTransition();
  const [isReferenceVideoUploading, setIsReferenceVideoUploading] = useState(false);
  const [isReferenceImageUploading, setIsReferenceImageUploading] = useState(false);

  useEffect(() => {
    if (uploadingSlot) return;
    setAssetPreviews(input.initialPreviews);
    setProductReady(Boolean(input.initialPreviews.product_photos));
  }, [
    input.initialPreviews.logo,
    input.initialPreviews.product_photos,
    input.initialPreviews.reference_videos,
    uploadingSlot
  ]);

  function clearSlotError(slot: BrandAssetSlotId) {
    setAssetUploadErrors((prev) => {
      if (!prev[slot]) return prev;
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  }

  function setSlotError(slot: BrandAssetSlotId, message: string) {
    setAssetUploadErrors((prev) => ({ ...prev, [slot]: message }));
  }

  function onAssetSlotClick(slot: BrandAssetSlotId) {
    clearSlotError(slot);
    if (slot === "reference_videos") {
      referenceVideoInputRef.current?.click();
      return;
    }
    pendingImageSlotRef.current = slot;
    imageInputRef.current?.click();
  }

  function handleImageFile(file: File) {
    const slot = pendingImageSlotRef.current;
    clearSlotError(slot);
    setUploadingSlot(slot);

    const localPreview = URL.createObjectURL(file);
    setAssetPreviews((prev) => ({ ...prev, [slot]: localPreview }));
    if (slot === "product_photos") {
      setProductReady(true);
      input.onProductUploaded?.(localPreview);
    }

    startImageUpload(async () => {
      try {
        const uploadFile = await prepareImageFile(file, input.locale);

        if (slot === "logo") {
          const fd = new FormData();
          fd.set("image_file", uploadFile);
          const res = await fetch(
            `/api/brand/projects/${encodeURIComponent(input.projectId)}/logo?lang=${input.locale}`,
            { method: "POST", body: fd }
          );
          const raw = await res.text();
          type UploadLogoResponse = {
            ok: boolean;
            error?: string;
            preview_url?: string;
            asset?: { file_url: string };
          };
          let result: UploadLogoResponse;
          try {
            result = JSON.parse(raw) as UploadLogoResponse;
          } catch {
            throw new Error(
              input.locale === "zh"
                ? res.status === 413
                  ? "图片过大，请换一张更小的图片后重试"
                  : `Logo 上传失败（HTTP ${res.status}）`
                : res.status === 413
                  ? "Image is too large — choose a smaller image and try again"
                  : `Logo upload failed (HTTP ${res.status})`
            );
          }
          if (!res.ok || !result.ok) {
            throw new Error(result.error ?? `Logo upload failed (HTTP ${res.status})`);
          }
          const savedPreview = productPreviewSrc(
            result.preview_url ?? result.asset?.file_url ?? localPreview
          );
          setAssetPreviews((prev) => ({ ...prev, logo: savedPreview }));
          input.onMediaUpdated?.();
          return;
        }

        const fd = new FormData();
        fd.set("image_file", uploadFile);
        const res = await fetch(
          `/api/brand/projects/${encodeURIComponent(input.projectId)}/product-image?lang=${input.locale}`,
          { method: "POST", body: fd }
        );
        const raw = await res.text();
        type UploadProductImageResponse = {
          ok: boolean;
          error?: string;
          preview_url?: string;
          original?: { file_url: string };
        };
        let result: UploadProductImageResponse;
        try {
          result = JSON.parse(raw) as UploadProductImageResponse;
        } catch {
          throw new Error(
            input.locale === "zh"
              ? res.status === 413
                ? "图片过大，请换一张更小的图片后重试"
                : `上传失败（HTTP ${res.status}），请稍后重试`
              : res.status === 413
                ? "Image is too large — choose a smaller image and try again"
                : `Upload failed (HTTP ${res.status}) — try again`
          );
        }

        if (!res.ok || !result.ok) {
          throw new Error(result.error ?? `Upload failed (HTTP ${res.status})`);
        }

        const savedPreview = productPreviewSrc(
          result.preview_url ?? result.original?.file_url ?? localPreview
        );
        setAssetPreviews((prev) => ({ ...prev, product_photos: savedPreview }));
        input.onProductUploaded?.(savedPreview);
        input.onMediaUpdated?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setSlotError(
          slot,
          input.locale === "zh"
            ? message || "上传失败，请稍后重试"
            : message || "Upload failed — try again"
        );
        setAssetPreviews((prev) => ({
          ...prev,
          [slot]: input.initialPreviews[slot]
        }));
        if (slot === "product_photos") {
          setProductReady(Boolean(input.initialPreviews.product_photos));
        }
      } finally {
        setUploadingSlot(null);
      }
    });
  }

  function handleReferenceVideoFile(file: File) {
    clearSlotError("reference_videos");
    setUploadingSlot("reference_videos");
    setReferenceVideoUploadProgress(0);
    setIsReferenceVideoUploading(true);

    void (async () => {
      const MAX_REFERENCE_VIDEO_BYTES = 200 * 1024 * 1024;
      if (file.size > MAX_REFERENCE_VIDEO_BYTES) {
        setSlotError(
          "reference_videos",
          input.locale === "zh" ? "参考视频建议控制在 200MB 以内" : "Keep reference videos under 200MB"
        );
        setUploadingSlot(null);
        setReferenceVideoUploadProgress(null);
        setIsReferenceVideoUploading(false);
        return;
      }

      try {
        const result = await uploadReferenceVideoWithProgress(
          `/api/brand/projects/${encodeURIComponent(input.projectId)}/reference-video?lang=${input.locale}`,
          file,
          setReferenceVideoUploadProgress
        );

        if (!result.reference) {
          throw new Error(
            input.locale === "zh" ? "参考视频上传失败" : "Reference video upload failed"
          );
        }

        setAssetPreviews((prev) => ({
          ...prev,
          reference_videos: result.reference!.source_url
        }));
        input.onReferenceUploaded?.(result.reference);
        input.onMediaUpdated?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setSlotError(
          "reference_videos",
          input.locale === "zh"
            ? message.includes("200MB")
              ? "参考视频建议控制在 200MB 以内"
              : message || "参考视频上传失败"
            : message.includes("200MB")
              ? "Keep reference videos under 200MB"
              : message || "Reference video upload failed"
        );
        setAssetPreviews((prev) => ({
          ...prev,
          reference_videos: input.initialPreviews.reference_videos
        }));
      } finally {
        setUploadingSlot(null);
        setReferenceVideoUploadProgress(null);
        setIsReferenceVideoUploading(false);
      }
    })();
  }

  function handleReferenceImageFile(file: File) {
    setIsReferenceImageUploading(true);
    void (async () => {
      try {
        const fd = new FormData();
        fd.set("image_file", file);
        const res = await fetch(
          `/api/brand/projects/${encodeURIComponent(input.projectId)}/reference-image?lang=${input.locale}`,
          { method: "POST", body: fd }
        );
        const result = (await res.json()) as UploadReferenceVideoResponse;
        if (!res.ok || !result.ok || !result.reference) {
          throw new Error(result.error ?? (input.locale === "zh" ? "参考截图上传失败" : "Reference image upload failed"));
        }
        input.onReferenceUploaded?.(result.reference);
        input.onMediaUpdated?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        setSlotError(
          "reference_videos",
          input.locale === "zh" ? message || "参考截图上传失败" : message || "Reference image upload failed"
        );
      } finally {
        setIsReferenceImageUploading(false);
      }
    })();
  }

  return {
    assetPreviews,
    assetUploadErrors,
    uploadingSlot,
    referenceVideoUploadProgress,
    productReady,
    isImageUploading,
    isReferenceVideoUploading,
    isReferenceImageUploading,
    imageInputRef,
    referenceVideoInputRef,
    referenceImageInputRef,
    onAssetSlotClick,
    handleImageFile,
    handleReferenceVideoFile,
    handleReferenceImageFile
  };
}
