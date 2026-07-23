export const CANVAS_CREATOR_TOKEN_BUDGET = 3151;

import {
  canvasMusicCreditQuote,
  type MurekaMusicTier
} from "@/lib/canvas/mureka-credits-pricing";
import {
  isSeedanceVideoModel,
  seedanceVideoCreditQuote
} from "@/lib/canvas/seedance-credits-pricing";

export type VideoQuality = "480p" | "720p" | "1080p" | "4k";

export type VideoGenerationCreditInput = {
  aspectRatio: string;
  duration: number;
  quality: VideoQuality;
  audio: boolean;
  webSearch: boolean;
  cameraMovements: string[];
  referenceMimeType?: string;
  referenceVideoDurationSec?: number;
};

export type ImageGenerationCreditInput = {
  quality: "auto" | "high" | "medium" | "low";
  width: number;
  height: number;
  outputs: number;
};

export type MusicGenerationCreditInput = {
  mode: "simple" | "custom" | "soundtrack";
  instrumental: boolean;
};

const LEGACY_VIDEO_QUALITY_BASE_RATES: Record<VideoQuality, number> = {
  "480p": 8,
  "720p": 18,
  "1080p": 18,
  "4k": 100
};

function legacyVideoCreditsPerSecond(quality: VideoQuality, durationSeconds: number) {
  if (quality === "1080p" && durationSeconds <= 6) return 50;
  return LEGACY_VIDEO_QUALITY_BASE_RATES[quality];
}

function isDiscountVideoModel(modelId: string) {
  return modelId.includes("fast") || modelId.includes("mini") || modelId.includes("flash");
}

export function computeVideoGenerationCredits(
  settings: VideoGenerationCreditInput,
  modelId = "seedance-2.0"
) {
  if (isSeedanceVideoModel(modelId)) {
    const quote = seedanceVideoCreditQuote({
      modelId,
      parameters: {
        duration: settings.duration,
        quality: settings.quality,
        referenceMimeType: settings.referenceMimeType,
        referenceVideoDurationSec: settings.referenceVideoDurationSec
      }
    });
    if (quote) return quote.creditPrice;
    return 69;
  }

  const duration = Math.max(1, Math.round(settings.duration));
  const rate = legacyVideoCreditsPerSecond(settings.quality, duration);
  let credits = rate * duration;

  if (isDiscountVideoModel(modelId)) credits *= 0.85;
  if (settings.webSearch) credits *= 1.08;
  if (settings.cameraMovements.length > 0) {
    credits *= 1 + settings.cameraMovements.length * 0.05;
  }

  return Math.max(1, Math.round(credits));
}

export function computeImageGenerationCredits(settings: ImageGenerationCreditInput) {
  const qualityMultiplier =
    settings.quality === "high"
      ? 1.4
      : settings.quality === "low"
        ? 0.8
        : settings.quality === "auto"
          ? 1
          : 1;
  const sizeMultiplier = Math.max(settings.width, settings.height) >= 2048 ? 1.5 : 1;
  return Math.max(1, Math.round(15 * qualityMultiplier * sizeMultiplier * settings.outputs));
}

function musicModelTier(modelId: string): MurekaMusicTier {
  const normalized = modelId.trim().toLowerCase();
  if (normalized.includes("studio") || normalized.includes("mureka-8")) {
    return "premium";
  }
  return "v76";
}

export function computeMusicGenerationCredits(
  settings: MusicGenerationCreditInput,
  modelId = "v7.5-basic"
) {
  const mode =
    settings.mode === "simple"
      ? "SIMPLE"
      : settings.mode === "soundtrack"
        ? "SOUNDTRACK"
        : "CUSTOM";
  return canvasMusicCreditQuote({
    tier: musicModelTier(modelId),
    mode,
    instrumental: settings.instrumental,
    includesLyricsApi: mode === "CUSTOM" && !settings.instrumental
  }).creditPrice;
}

export function computeGenerationCredits(input: {
  type: "IMAGE" | "VIDEO" | "MUSIC";
  model: string;
  parameters: Record<string, unknown>;
}) {
  if (input.type === "VIDEO") {
    return computeVideoGenerationCredits(
      {
        aspectRatio: String(input.parameters.aspectRatio ?? "auto"),
        duration: Number(input.parameters.duration ?? 5),
        quality: (input.parameters.quality as VideoQuality) ?? "720p",
        audio: input.parameters.audio !== false,
        webSearch: input.parameters.webSearch === true,
        cameraMovements: String(input.parameters.cameraMovements ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        referenceMimeType:
          typeof input.parameters.referenceMimeType === "string"
            ? input.parameters.referenceMimeType
            : undefined,
        referenceVideoDurationSec:
          typeof input.parameters.referenceVideoDurationSec === "number"
            ? input.parameters.referenceVideoDurationSec
            : undefined
      },
      input.model
    );
  }

  if (input.type === "IMAGE") {
    return computeImageGenerationCredits({
      quality: (input.parameters.quality as ImageGenerationCreditInput["quality"]) ?? "medium",
      width: Number(input.parameters.width ?? 1024),
      height: Number(input.parameters.height ?? 1024),
      outputs: Number(input.parameters.outputs ?? 1)
    });
  }

  return computeMusicGenerationCredits(
    {
      mode: (input.parameters.mode as MusicGenerationCreditInput["mode"]) ?? "custom",
      instrumental: input.parameters.instrumental === true
    },
    input.model
  );
}

export function normalizeCanvasCreditsUsed(creditsUsed: unknown): number {
  if (typeof creditsUsed !== "number" || !Number.isFinite(creditsUsed)) return 0;
  return Math.min(CANVAS_CREATOR_TOKEN_BUDGET, Math.max(0, Math.round(creditsUsed)));
}

export function normalizeCanvasTokenBalance(balance: unknown): number {
  if (typeof balance !== "number" || !Number.isFinite(balance)) {
    return 0;
  }
  return Math.max(0, Math.round(balance));
}

export function computeCanvasTokenBalance(creditsUsed: unknown) {
  const used = normalizeCanvasCreditsUsed(creditsUsed);
  return Math.max(0, CANVAS_CREATOR_TOKEN_BUDGET - used);
}

export function hasEnoughCanvasCredits(balance: unknown, cost: number) {
  const normalizedBalance = normalizeCanvasTokenBalance(balance);
  const normalizedCost =
    typeof cost === "number" && Number.isFinite(cost) ? Math.max(0, Math.round(cost)) : 0;
  return normalizedBalance >= normalizedCost;
}

type WalletApiEnvelope = {
  success: boolean;
  data?: {
    summary?: {
      availableCredits?: number;
    };
  };
};

export async function fetchCanvasWalletBalance() {
  const response = await fetch("/api/v1/credits/wallet", { cache: "no-store" });
  const payload = (await response.json()) as WalletApiEnvelope;
  if (!response.ok || !payload.success || !payload.data?.summary) return null;
  return normalizeCanvasTokenBalance(payload.data.summary.availableCredits);
}
