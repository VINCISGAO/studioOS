import type { GenerationReferenceSlot } from "@/components/canvas/generation-kind-selector";

export type CanvasAssetLibraryKind = "image" | "video" | "audio";

export type CanvasLibraryAssetType = "REFERENCE_IMAGE" | "REFERENCE_VIDEO" | "MUSIC";

export const CANVAS_LIBRARY_ASSET_TYPE: Record<CanvasAssetLibraryKind, CanvasLibraryAssetType> = {
  image: "REFERENCE_IMAGE",
  video: "REFERENCE_VIDEO",
  audio: "MUSIC"
};

export function canvasLibraryKindFromReferenceSlot(
  slot: GenerationReferenceSlot
): CanvasAssetLibraryKind {
  if (slot === "image") return "image";
  if (slot === "audio") return "audio";
  return "video";
}

export function parseCanvasAssetLibraryKind(value: string | null): CanvasAssetLibraryKind | null {
  if (value === "image" || value === "video" || value === "audio") return value;
  return null;
}

export function libraryAcceptMime(kind: CanvasAssetLibraryKind) {
  if (kind === "image") {
    return "image/jpeg,image/png,image/webp,image/gif";
  }
  if (kind === "video") {
    return "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm";
  }
  return "audio/mpeg,audio/wav,audio/mp4,.mp3,.wav,.m4a";
}

export function libraryCopy(locale: "zh" | "en", kind: CanvasAssetLibraryKind) {
  if (locale === "zh") {
    if (kind === "image") {
      return {
        title: "图片素材库",
        empty: "暂无图片素材。支持批量上传，审核通过后可作为参考图。",
        upload: "批量上传图片"
      };
    }
    if (kind === "video") {
      return {
        title: "视频素材库",
        empty: "暂无视频素材。支持批量上传，审核通过后可作为参考视频。",
        upload: "批量上传视频"
      };
    }
    return {
      title: "音频素材库",
      empty: "暂无音频素材。支持批量上传，审核通过后可作为参考音频。",
      upload: "批量上传音频"
    };
  }

  if (kind === "image") {
    return {
      title: "Image library",
      empty: "No image assets yet. Batch upload supported; approved items can be used as references.",
      upload: "Upload images"
    };
  }
  if (kind === "video") {
    return {
      title: "Video library",
      empty: "No video assets yet. Batch upload supported; approved items can be used as references.",
      upload: "Upload videos"
    };
  }
  return {
    title: "Audio library",
    empty: "No audio assets yet. Batch upload supported; approved items can be used as references.",
    upload: "Upload audio"
  };
}
