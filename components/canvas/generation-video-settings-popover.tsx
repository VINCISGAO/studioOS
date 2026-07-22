"use client";

import type { PublicAiModelCapabilities } from "@/features/canvas/ai-model-catalog.types";
import {
  DEFAULT_VIDEO_SETTINGS,
  VIDEO_QUALITIES,
  type VideoAspectRatio,
  type VideoGenerationSettings,
  type VideoQuality
} from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    title: "视频设置",
    aspectRatio: "画面比例",
    duration: "时长",
    quality: "画质",
    audio: "音频",
    auto: "Auto"
  },
  en: {
    title: "Video settings",
    aspectRatio: "Aspect ratio",
    duration: "Duration",
    quality: "Quality",
    audio: "Audio",
    auto: "Auto"
  }
} as const;

function RatioIcon({ ratio }: { ratio: string }) {
  const sizes: Record<string, string> = {
    auto: "h-4 w-4 rounded border-dashed",
    "16:9": "h-2.5 w-[1.65rem] rounded-[2px]",
    "4:3": "h-3 w-4 rounded-[2px]",
    "1:1": "h-3.5 w-3.5 rounded-[2px]",
    "3:4": "h-4 w-3 rounded-[2px]",
    "9:16": "h-[1.125rem] w-2.5 rounded-[2px]",
    "21:9": "h-2 w-[1.85rem] rounded-[2px]"
  };
  return (
    <span
      className={cn(
        "shrink-0 border border-zinc-400/80 bg-zinc-100",
        sizes[ratio] ?? sizes.auto
      )}
    />
  );
}

function AspectRatioChip({
  ratio,
  selected,
  label,
  onSelect
}: {
  ratio: string;
  selected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 text-[11px] font-medium transition",
        selected
          ? "border-zinc-900 bg-zinc-50 text-zinc-900 shadow-[inset_0_0_0_1px_rgba(24,24,27,0.04)]"
          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50/80"
      )}
    >
      <RatioIcon ratio={ratio} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="min-w-0 text-sm text-zinc-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-zinc-900" : "bg-zinc-200"
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

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

function durationBounds(capabilities: PublicAiModelCapabilities) {
  if (capabilities.supportedDurations.length > 0) {
    const sorted = [...capabilities.supportedDurations].sort((a, b) => a - b);
    return {
      min: sorted[0] ?? 3,
      max: sorted[sorted.length - 1] ?? 15,
      discrete: sorted
    };
  }
  return {
    min: capabilities.minDurationSec ?? 3,
    max: capabilities.maxDurationSec ?? 15,
    discrete: null as number[] | null
  };
}

export function GenerationVideoSettingsPopover({
  locale,
  settings,
  capabilities,
  onChange
}: {
  locale: Locale;
  settings: VideoGenerationSettings;
  capabilities: PublicAiModelCapabilities;
  onChange: (settings: VideoGenerationSettings) => void;
  onClose?: () => void;
}) {
  const t = copy[locale];
  const aspectRatios = allowedAspectRatios(capabilities);
  const qualities = allowedQualities(capabilities);
  const durationConfig = durationBounds(capabilities);

  function ratioLabel(ratio: string) {
    return ratio === "auto" ? t.auto : ratio;
  }

  function setDuration(duration: number) {
    if (durationConfig.discrete?.length) {
      const closest = durationConfig.discrete.reduce((best, current) =>
        Math.abs(current - duration) < Math.abs(best - duration) ? current : best
      );
      onChange({ ...settings, duration: closest });
      return;
    }
    onChange({ ...settings, duration });
  }

  return (
    <div className="absolute bottom-full left-0 z-[120] mb-2 w-[min(340px,calc(100vw-32px))] rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl">
      <h3 className="mb-4 text-sm font-semibold text-zinc-950">{t.title}</h3>

      <div className="space-y-5">
        {aspectRatios.length > 0 ? (
          <div>
            <div className="mb-2.5 text-xs font-medium text-zinc-700">{t.aspectRatio}</div>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map((ratio) => (
                <AspectRatioChip
                  key={ratio}
                  ratio={ratio}
                  label={ratioLabel(ratio)}
                  selected={settings.aspectRatio === ratio}
                  onSelect={() =>
                    onChange({ ...settings, aspectRatio: ratio as VideoAspectRatio })
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-700">
            <span>{t.duration}</span>
            <span className="tabular-nums text-zinc-900">{settings.duration}s</span>
          </div>
          {durationConfig.discrete ? (
            <div className="flex flex-wrap gap-2">
              {durationConfig.discrete.map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => onChange({ ...settings, duration })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    settings.duration === duration
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  )}
                >
                  {duration}s
                </button>
              ))}
            </div>
          ) : (
            <input
              type="range"
              min={durationConfig.min}
              max={durationConfig.max}
              step={1}
              value={settings.duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="w-full accent-zinc-900"
            />
          )}
        </div>

        {qualities.length > 0 ? (
          <div>
            <div className="mb-2 text-xs font-medium text-zinc-700">{t.quality}</div>
            <div className="grid grid-cols-4 gap-2">
              {qualities.map((quality) => (
                <button
                  key={quality}
                  type="button"
                  onClick={() => onChange({ ...settings, quality })}
                  className={cn(
                    "h-9 rounded-xl border text-xs font-medium transition",
                    settings.quality === quality
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                  )}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {capabilities.supportsAudioInput ? (
          <div className="space-y-2 border-t border-zinc-100 pt-3">
            <Toggle
              label={t.audio}
              checked={settings.audio}
              onChange={(audio) => onChange({ ...settings, audio })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { DEFAULT_VIDEO_SETTINGS };
