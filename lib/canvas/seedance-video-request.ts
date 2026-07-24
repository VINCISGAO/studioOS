import "server-only";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { canvasAssetService } from "@/features/canvas/canvas-asset.service";
import {
  resolveSeedanceApiModelId,
  seedanceCreateVideoTask,
  type SeedanceGenerationType,
  type SeedanceVideoInput
} from "@/lib/canvas/seedance-client";
import { resolveSeedancePublicAssetUrl } from "@/lib/canvas/seedance-public-asset-url";
import { appError } from "@/lib/core/errors";

export type VideoJobPayload = {
  aspectRatio?: string;
  duration?: number;
  quality?: string;
  audio?: boolean;
  webSearch?: boolean;
  referenceAssetId?: string;
  referenceUrl?: string;
  referenceNodeId?: string;
  referenceMimeType?: string;
  lastFrameReferenceAssetId?: string;
  lastFrameReferenceUrl?: string;
  lastFrameReferenceNodeId?: string;
  lastFrameReferenceMimeType?: string;
  libraryReferenceAssetIds?: string;
  videoReferenceMode?: string;
  mode?: string;
};

function readPayload(raw: unknown): VideoJobPayload {
  if (!raw || typeof raw !== "object") return {};
  const record = raw as Record<string, unknown>;
  return {
    aspectRatio: typeof record.aspectRatio === "string" ? record.aspectRatio : undefined,
    duration: typeof record.duration === "number" ? record.duration : undefined,
    quality: typeof record.quality === "string" ? record.quality : undefined,
    audio: typeof record.audio === "boolean" ? record.audio : undefined,
    webSearch: typeof record.webSearch === "boolean" ? record.webSearch : undefined,
    referenceAssetId:
      typeof record.referenceAssetId === "string" ? record.referenceAssetId : undefined,
    referenceUrl: typeof record.referenceUrl === "string" ? record.referenceUrl : undefined,
    referenceNodeId:
      typeof record.referenceNodeId === "string" ? record.referenceNodeId : undefined,
    referenceMimeType:
      typeof record.referenceMimeType === "string" ? record.referenceMimeType : undefined,
    lastFrameReferenceAssetId:
      typeof record.lastFrameReferenceAssetId === "string"
        ? record.lastFrameReferenceAssetId
        : undefined,
    lastFrameReferenceUrl:
      typeof record.lastFrameReferenceUrl === "string" ? record.lastFrameReferenceUrl : undefined,
    lastFrameReferenceNodeId:
      typeof record.lastFrameReferenceNodeId === "string"
        ? record.lastFrameReferenceNodeId
        : undefined,
    lastFrameReferenceMimeType:
      typeof record.lastFrameReferenceMimeType === "string"
        ? record.lastFrameReferenceMimeType
        : undefined,
    libraryReferenceAssetIds:
      typeof record.libraryReferenceAssetIds === "string"
        ? record.libraryReferenceAssetIds
        : undefined,
    videoReferenceMode:
      typeof record.videoReferenceMode === "string" ? record.videoReferenceMode : undefined,
    mode: typeof record.mode === "string" ? record.mode : undefined
  };
}

function mapAspectRatio(value: string | undefined) {
  const normalized = (value ?? "auto").trim().toLowerCase();
  if (
    normalized === "16:9" ||
    normalized === "4:3" ||
    normalized === "1:1" ||
    normalized === "3:4" ||
    normalized === "9:16" ||
    normalized === "21:9"
  ) {
    return normalized;
  }
  return "adaptive";
}

function mapResolution(value: string | undefined) {
  const normalized = (value ?? "720p").trim().toLowerCase();
  if (normalized === "4k") return "4k";
  if (normalized === "1080p") return "1080p";
  if (normalized === "480p") return "480p";
  return "720p";
}

function isImageMime(mime: string | undefined) {
  return Boolean(mime?.trim().toLowerCase().startsWith("image/"));
}

function isVideoMime(mime: string | undefined) {
  return Boolean(mime?.trim().toLowerCase().startsWith("video/"));
}

function isAudioMime(mime: string | undefined) {
  return Boolean(mime?.trim().toLowerCase().startsWith("audio/"));
}

function resolveGenerationType(input: {
  imageUrls: string[];
  videoUrls: string[];
  audioUrls: string[];
  videoReferenceMode?: string;
}): SeedanceGenerationType {
  const hasMedia =
    input.imageUrls.length > 0 || input.videoUrls.length > 0 || input.audioUrls.length > 0;
  if (!hasMedia) return "text-to-video";

  if (input.videoUrls.length > 0 || input.audioUrls.length > 0) {
    return "reference-to-video";
  }

  const refMode = (input.videoReferenceMode ?? "reference").trim();
  if (refMode === "keyframes" || refMode === "edit") {
    return "image-to-video";
  }

  return "reference-to-video";
}

export async function submitSeedanceVideoTask(input: {
  user: AuthUserDto;
  internalModelId: string;
  prompt: string;
  payload: unknown;
  callbackUrl?: string | null;
}) {
  const payload = readPayload(input.payload);
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw appError("VALIDATION_ERROR", "Prompt is required for Seedance video generation");
  }

  let referenceMimeType = payload.referenceMimeType;
  if (payload.referenceAssetId?.trim() && !referenceMimeType) {
    const asset = await canvasAssetService.requireAsset(payload.referenceAssetId, input.user);
    referenceMimeType = asset.mimeType;
  }

  let lastFrameMimeType = payload.lastFrameReferenceMimeType;
  if (payload.lastFrameReferenceAssetId?.trim() && !lastFrameMimeType) {
    const asset = await canvasAssetService.requireAsset(
      payload.lastFrameReferenceAssetId,
      input.user
    );
    lastFrameMimeType = asset.mimeType;
  }

  const referenceUrl = await resolveSeedancePublicAssetUrl({
    user: input.user,
    assetId: payload.referenceAssetId,
    referenceUrl: payload.referenceUrl
  });

  const lastFrameReferenceUrl = await resolveSeedancePublicAssetUrl({
    user: input.user,
    assetId: payload.lastFrameReferenceAssetId,
    referenceUrl: payload.lastFrameReferenceUrl
  });

  const imageUrls: string[] = [];
  const videoUrls: string[] = [];
  const audioUrls: string[] = [];

  if (referenceUrl) {
    if (isVideoMime(referenceMimeType)) {
      videoUrls.push(referenceUrl);
    } else if (isAudioMime(referenceMimeType)) {
      audioUrls.push(referenceUrl);
    } else if (isImageMime(referenceMimeType) || !referenceMimeType) {
      imageUrls.push(referenceUrl);
    } else {
      imageUrls.push(referenceUrl);
    }
  }

  if (lastFrameReferenceUrl) {
    if (isImageMime(lastFrameMimeType) || !lastFrameMimeType) {
      imageUrls.push(lastFrameReferenceUrl);
    }
  }

  const extraAssetIds = (payload.libraryReferenceAssetIds ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const assetId of extraAssetIds) {
    if (assetId === payload.referenceAssetId?.trim()) continue;
    if (assetId === payload.lastFrameReferenceAssetId?.trim()) continue;
    const extraUrl = await resolveSeedancePublicAssetUrl({
      user: input.user,
      assetId
    });
    if (!extraUrl) continue;
    if (imageUrls.includes(extraUrl) || videoUrls.includes(extraUrl) || audioUrls.includes(extraUrl)) {
      continue;
    }
    try {
      const asset = await canvasAssetService.requireAsset(assetId, input.user);
      if (isVideoMime(asset.mimeType)) {
        videoUrls.push(extraUrl);
      } else if (isAudioMime(asset.mimeType)) {
        audioUrls.push(extraUrl);
      } else {
        imageUrls.push(extraUrl);
      }
    } catch {
      imageUrls.push(extraUrl);
    }
  }

  const generation_type = resolveGenerationType({
    imageUrls,
    videoUrls,
    audioUrls,
    videoReferenceMode: payload.videoReferenceMode
  });

  if (generation_type === "image-to-video" && imageUrls.length > 2) {
    throw appError(
      "VALIDATION_ERROR",
      "Image-to-video supports at most 2 frame images; use reference mode for multiple assets"
    );
  }

  if (generation_type === "image-to-video" && imageUrls.length === 0) {
    throw appError("VALIDATION_ERROR", "Image-to-video requires an image reference URL");
  }

  if (payload.videoReferenceMode === "keyframes" && imageUrls.length < 2) {
    throw appError("VALIDATION_ERROR", "Start/end frame mode requires first and last frame images");
  }

  if (payload.videoReferenceMode === "edit" && imageUrls.length === 0) {
    throw appError("VALIDATION_ERROR", "Video edit mode requires an image reference URL");
  }

  if (
    generation_type === "reference-to-video" &&
    imageUrls.length === 0 &&
    videoUrls.length === 0 &&
    audioUrls.length === 0
  ) {
    throw appError("VALIDATION_ERROR", "Reference-to-video requires at least one media reference");
  }

  const body: SeedanceVideoInput = {
    prompt,
    generation_type,
    duration: Math.min(15, Math.max(4, Math.round(payload.duration ?? 5))),
    aspect_ratio: mapAspectRatio(payload.aspectRatio),
    resolution: mapResolution(payload.quality),
    generate_audio: payload.audio !== false,
    watermark: false,
    web_search: payload.webSearch === true,
    return_last_frame: false,
    seed: -1,
    ...(imageUrls.length ? { image_urls: imageUrls.slice(0, 9) } : {}),
    ...(videoUrls.length ? { video_urls: videoUrls.slice(0, 3) } : {}),
    ...(audioUrls.length ? { audio_urls: audioUrls.slice(0, 3) } : {})
  };

  const model = resolveSeedanceApiModelId(input.internalModelId);
  const created = await seedanceCreateVideoTask({
    model,
    callbackUrl: input.callbackUrl,
    input: body
  });

  return {
    model,
    generationType: generation_type,
    taskId: created.taskId,
    providerCredits: created.credits,
    input: body
  };
}
