import type { PublicAiModelCapabilities } from "@/features/canvas/ai-model-catalog.types";

/** Seedance + canvas video generation hard cap (see seedance-video-request + validation). */
export const CANVAS_VIDEO_MAX_DURATION_SEC = 15;

export const DEFAULT_VIDEO_SUPPORTED_DURATIONS = [5, 10, 15] as const;

export function normalizeVideoModelCapabilities(
  capabilities: PublicAiModelCapabilities
): PublicAiModelCapabilities {
  const minDurationSec = capabilities.minDurationSec ?? 3;
  const maxDurationSec = Math.min(
    capabilities.maxDurationSec ?? CANVAS_VIDEO_MAX_DURATION_SEC,
    CANVAS_VIDEO_MAX_DURATION_SEC
  );

  const filteredDurations = capabilities.supportedDurations.filter(
    (duration) => duration >= minDurationSec && duration <= maxDurationSec
  );
  const supportedDurations =
    filteredDurations.length > 0
      ? [...new Set(filteredDurations)].sort((a, b) => a - b)
      : [...DEFAULT_VIDEO_SUPPORTED_DURATIONS];

  return {
    ...capabilities,
    supportedDurations,
    maxDurationSec,
    minDurationSec
  };
}

export function videoDurationBounds(capabilities: PublicAiModelCapabilities) {
  const normalized = normalizeVideoModelCapabilities(capabilities);
  if (normalized.supportedDurations.length > 0) {
    const sorted = normalized.supportedDurations;
    return {
      min: sorted[0] ?? minDurationOrDefault(normalized),
      max: sorted[sorted.length - 1] ?? normalized.maxDurationSec ?? CANVAS_VIDEO_MAX_DURATION_SEC,
      discrete: sorted
    };
  }
  return {
    min: normalized.minDurationSec ?? 3,
    max: normalized.maxDurationSec ?? CANVAS_VIDEO_MAX_DURATION_SEC,
    discrete: null as number[] | null
  };
}

function minDurationOrDefault(capabilities: PublicAiModelCapabilities) {
  return capabilities.minDurationSec ?? 3;
}

export function clampVideoDurationSec(
  duration: number,
  capabilities: PublicAiModelCapabilities
): number {
  const normalized = normalizeVideoModelCapabilities(capabilities);
  let next = duration;
  if (normalized.supportedDurations.length > 0) {
    next = normalized.supportedDurations.includes(next)
      ? next
      : normalized.supportedDurations.reduce((best, current) =>
          Math.abs(current - next) < Math.abs(best - next) ? current : best
        );
  }
  if (normalized.maxDurationSec != null && next > normalized.maxDurationSec) {
    next = normalized.maxDurationSec;
  }
  if (normalized.minDurationSec != null && next < normalized.minDurationSec) {
    next = normalized.minDurationSec;
  }
  return next;
}
