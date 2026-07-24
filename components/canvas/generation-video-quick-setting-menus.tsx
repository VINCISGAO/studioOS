"use client";

import type { PublicAiModelCapabilities } from "@/features/canvas/ai-model-catalog.types";
import {
  VIDEO_QUALITIES,
  type VideoAspectRatio,
  type VideoGenerationSettings,
  type VideoQuality
} from "@/lib/canvas/generation-ui";
import { formatVideoQualityLabel } from "@/lib/canvas/generation-video-labels";
import { videoDurationBounds } from "@/lib/canvas/video-duration-policy";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function allowedAspectRatios(capabilities: PublicAiModelCapabilities) {
  if (capabilities.supportedAspectRatios.length === 0) {
    return ["auto", "16:9", "4:3", "1:1", "3:4", "9:16", "21:9"];
  }
  return capabilities.supportedAspectRatios;
}

function allowedQualities(capabilities: PublicAiModelCapabilities): VideoQuality[] {
  if (capabilities.supportedResolutions.length === 0) return VIDEO_QUALITIES;
  return VIDEO_QUALITIES.filter((quality) =>
    capabilities.supportedResolutions.some((item) => item.toLowerCase() === quality.toLowerCase())
  );
}

function durationOptions(capabilities: PublicAiModelCapabilities) {
  const bounds = videoDurationBounds(capabilities);
  if (bounds.discrete?.length) return bounds.discrete;
  return Array.from({ length: bounds.max - bounds.min + 1 }, (_, index) => bounds.min + index);
}

function menuShellClassName() {
  return "overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl";
}

export function GenerationVideoAspectMenu({
  locale,
  settings,
  capabilities,
  onChange,
  onClose
}: {
  locale: Locale;
  settings: VideoGenerationSettings;
  capabilities: PublicAiModelCapabilities;
  onChange: (settings: VideoGenerationSettings) => void;
  onClose: () => void;
}) {
  const ratios = allowedAspectRatios(capabilities);

  return (
    <div className={cn(menuShellClassName(), "w-[168px]")}>
      {ratios.map((ratio) => (
        <button
          key={ratio}
          type="button"
          onClick={() => {
            onChange({ ...settings, aspectRatio: ratio as VideoAspectRatio });
            onClose();
          }}
          className={cn(
            "flex w-full px-3 py-2.5 text-left text-xs text-zinc-800 hover:bg-zinc-50",
            settings.aspectRatio === ratio && "bg-zinc-50 font-medium"
          )}
        >
          {ratio === "auto" ? (locale === "zh" ? "Auto" : "Auto") : ratio}
        </button>
      ))}
    </div>
  );
}

export function GenerationVideoDurationMenu({
  settings,
  capabilities,
  onChange,
  onClose
}: {
  settings: VideoGenerationSettings;
  capabilities: PublicAiModelCapabilities;
  onChange: (settings: VideoGenerationSettings) => void;
  onClose: () => void;
}) {
  const durations = durationOptions(capabilities);

  return (
    <div className={cn(menuShellClassName(), "w-[120px]")}>
      {durations.map((duration) => (
        <button
          key={duration}
          type="button"
          onClick={() => {
            onChange({ ...settings, duration });
            onClose();
          }}
          className={cn(
            "flex w-full px-3 py-2.5 text-left text-xs text-zinc-800 hover:bg-zinc-50",
            settings.duration === duration && "bg-zinc-50 font-medium"
          )}
        >
          {duration}s
        </button>
      ))}
    </div>
  );
}

export function GenerationVideoQualityMenu({
  settings,
  capabilities,
  onChange,
  onClose
}: {
  settings: VideoGenerationSettings;
  capabilities: PublicAiModelCapabilities;
  onChange: (settings: VideoGenerationSettings) => void;
  onClose: () => void;
}) {
  const qualities = allowedQualities(capabilities);

  return (
    <div className={cn(menuShellClassName(), "w-[120px]")}>
      {qualities.map((quality) => (
        <button
          key={quality}
          type="button"
          onClick={() => {
            onChange({ ...settings, quality });
            onClose();
          }}
          className={cn(
            "flex w-full px-3 py-2.5 text-left text-xs text-zinc-800 hover:bg-zinc-50",
            settings.quality === quality && "bg-zinc-50 font-medium"
          )}
        >
          {formatVideoQualityLabel(quality)}
        </button>
      ))}
    </div>
  );
}
