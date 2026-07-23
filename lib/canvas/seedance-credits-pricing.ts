/**
 * Seedance official credits → VINCIS customer credits (+15% service fee).
 *
 * Source: https://seedance2.ai/zh/pricing (Seedance 2.0 / 1.x per-second tables)
 *
 * @see docs/SEEDANCE_CREDITS_PRICING.md
 */

export const SEEDANCE_SERVICE_FEE_RATE = 0.15;

export type SeedanceResolution = "480p" | "720p" | "1080p" | "4k";

export type SeedanceModelVariant =
  | "seedance-2.0"
  | "seedance-2.0-fast"
  | "seedance-2.0-mini"
  | "seedance-1.5-pro"
  | "seedance-1.0-pro"
  | "seedance-1.0-lite";

type RateTable = Partial<Record<SeedanceResolution, number>>;

/** Official Seedance credits per second — no video reference input. */
const SEEDANCE_RATES_NO_VIDEO: Record<SeedanceModelVariant, RateTable> = {
  "seedance-2.0": { "480p": 6, "720p": 12, "1080p": 30, "4k": 70 },
  "seedance-2.0-fast": { "480p": 5, "720p": 10 },
  "seedance-2.0-mini": { "480p": 3, "720p": 6 },
  "seedance-1.5-pro": { "480p": 2, "720p": 5, "1080p": 10 },
  "seedance-1.0-pro": { "480p": 2, "720p": 5, "1080p": 10 },
  "seedance-1.0-lite": { "480p": 1, "720p": 3, "1080p": 8 }
};

/** Official Seedance credits per second — video included as reference (combined duration). */
const SEEDANCE_RATES_WITH_VIDEO: Record<SeedanceModelVariant, RateTable> = {
  "seedance-2.0": { "480p": 4, "720p": 8, "1080p": 20, "4k": 40 },
  "seedance-2.0-fast": { "480p": 3, "720p": 6 },
  "seedance-2.0-mini": { "480p": 2, "720p": 4 },
  "seedance-1.5-pro": { "480p": 2, "720p": 5, "1080p": 10 },
  "seedance-1.0-pro": { "480p": 2, "720p": 5, "1080p": 10 },
  "seedance-1.0-lite": { "480p": 1, "720p": 3, "1080p": 8 }
};

const SEEDANCE_MODEL_ALIASES: Record<string, SeedanceModelVariant> = {
  "seedance-2.0": "seedance-2.0",
  "seedance-2.0-fast": "seedance-2.0-fast",
  "seedance-2.0-mini": "seedance-2.0-mini",
  "seedance-1.5-pro": "seedance-1.5-pro",
  "seedance-1.0-pro": "seedance-1.0-pro",
  "seedance-1.0-lite": "seedance-1.0-lite"
};

export function normalizeSeedanceModelId(modelId: string): SeedanceModelVariant | null {
  const normalized = modelId.trim().toLowerCase().replace(/\s+/g, "-");
  return SEEDANCE_MODEL_ALIASES[normalized] ?? null;
}

export function isSeedanceVideoModel(modelId: string) {
  return normalizeSeedanceModelId(modelId) != null;
}

export function normalizeSeedanceResolution(value: unknown): SeedanceResolution | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim().toLowerCase();
  if (raw === "4k" || raw === "2160p" || raw === "3840") return "4k";
  if (raw === "1080p" || raw === "1920") return "1080p";
  if (raw === "720p" || raw === "1280") return "720p";
  if (raw === "480p" || raw === "854") return "480p";
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    if (numeric >= 3840) return "4k";
    if (numeric >= 1920) return "1080p";
    if (numeric >= 1280) return "720p";
    if (numeric >= 480) return "480p";
  }
  return null;
}

export function seedanceOfficialCreditsPerSecond(input: {
  modelId: string;
  resolution: SeedanceResolution;
  hasVideoReference: boolean;
}) {
  const variant = normalizeSeedanceModelId(input.modelId);
  if (!variant) return null;
  const table = input.hasVideoReference ? SEEDANCE_RATES_WITH_VIDEO : SEEDANCE_RATES_NO_VIDEO;
  return table[variant][input.resolution] ?? null;
}

/** Customer price in Credits — always rounds up; minimum 1. */
export function seedanceCreditsToCustomerPrice(seedanceCredits: number) {
  return Math.max(1, Math.ceil(seedanceCredits * (1 + SEEDANCE_SERVICE_FEE_RATE)));
}

export function readVideoOutputDurationSec(parameters: Record<string, unknown>) {
  const duration = Number(parameters.duration ?? parameters.durationSec ?? 5);
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 5;
}

export function readReferenceVideoDurationSec(parameters: Record<string, unknown>) {
  const duration = Number(
    parameters.referenceVideoDurationSec ??
      parameters.referenceVideoDuration ??
      parameters.inputVideoDurationSec ??
      3
  );
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 3;
}

export function hasSeedanceVideoReferenceInput(parameters: Record<string, unknown>) {
  const mime = String(parameters.referenceMimeType ?? parameters.referenceMime ?? "").toLowerCase();
  if (mime.startsWith("video/")) return true;
  const inputType = String(parameters.inputType ?? "").trim().toUpperCase();
  if (inputType === "VIDEO" || inputType === "VIDEO_REFERENCE") return true;
  return false;
}

export function seedanceProviderCredits(input: {
  modelId: string;
  resolution: SeedanceResolution;
  outputDurationSec: number;
  hasVideoReference: boolean;
  referenceVideoDurationSec?: number;
}) {
  const rate = seedanceOfficialCreditsPerSecond({
    modelId: input.modelId,
    resolution: input.resolution,
    hasVideoReference: input.hasVideoReference
  });
  if (rate == null) return null;

  const billableSeconds = input.hasVideoReference
    ? Math.max(1, input.outputDurationSec + (input.referenceVideoDurationSec ?? 3))
    : Math.max(1, input.outputDurationSec);

  return Math.max(1, rate * billableSeconds);
}

export function seedanceVideoCreditQuote(input: {
  modelId: string;
  parameters: Record<string, unknown>;
}) {
  const resolution =
    normalizeSeedanceResolution(
      input.parameters.resolution ?? input.parameters.quality ?? input.parameters.width
    ) ?? "720p";
  const outputDurationSec = readVideoOutputDurationSec(input.parameters);
  const hasVideoReference = hasSeedanceVideoReferenceInput(input.parameters);
  const referenceVideoDurationSec = readReferenceVideoDurationSec(input.parameters);
  const providerCredits = seedanceProviderCredits({
    modelId: input.modelId,
    resolution,
    outputDurationSec,
    hasVideoReference,
    referenceVideoDurationSec
  });

  if (providerCredits == null) return null;

  const creditPrice = seedanceCreditsToCustomerPrice(providerCredits);
  const rate = seedanceOfficialCreditsPerSecond({
    modelId: input.modelId,
    resolution,
    hasVideoReference
  });

  return {
    resolution,
    outputDurationSec,
    hasVideoReference,
    referenceVideoDurationSec: hasVideoReference ? referenceVideoDurationSec : 0,
    billableSeconds: hasVideoReference
      ? outputDurationSec + referenceVideoDurationSec
      : outputDurationSec,
    seedanceCreditsPerSecond: rate,
    seedanceCredits: providerCredits,
    providerCostMinor: providerCredits,
    creditPrice,
    marginPercent:
      creditPrice > 0
        ? Math.round(((creditPrice - providerCredits) / creditPrice) * 100)
        : null
  };
}
