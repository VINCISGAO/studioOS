"use client";

import type { PublicAiModelCapabilities } from "@/features/canvas/ai-model-catalog.types";
import {
  DEFAULT_VIDEO_SETTINGS,
  VIDEO_ASPECT_RATIOS,
  type VideoAspectRatio,
  type VideoGenerationSettings
} from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    aspectRatio: "画面比例",
    duration: "时长",
    auto: "Auto"
  },
  en: {
    aspectRatio: "Aspect ratio",
    duration: "Duration",
    auto: "Auto"
  }
} as const;

const SETTINGS_PANEL_SHELL_CLASS =
  "rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl";

function RatioIcon({ ratio }: { ratio: string }) {
  const sizes: Record<string, string> = {
    "16:9": "h-2.5 w-[1.65rem] rounded-[2px]",
    "4:3": "h-3 w-4 rounded-[2px]",
    "1:1": "h-3.5 w-3.5 rounded-[2px]",
    "3:4": "h-4 w-3 rounded-[2px]",
    "9:16": "h-[1.125rem] w-2.5 rounded-[2px]",
    "21:9": "h-2 w-[1.85rem] rounded-[2px]"
  };
  const sizeClass = sizes[ratio];
  if (!sizeClass) return null;
  return (
    <span className={cn("shrink-0 border border-zinc-400/70 bg-white", sizeClass)} />
  );
}

function AspectRatioCard({
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
  const isAuto = ratio === "auto";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-xl bg-white transition",
        isAuto ? "h-[52px]" : "gap-1 py-2.5",
        selected ? "border-2 border-zinc-900" : "border border-zinc-200 hover:border-zinc-300"
      )}
    >
      {!isAuto ? <RatioIcon ratio={ratio} /> : null}
      <span className="text-[12px] font-medium text-zinc-900">{label}</span>
    </button>
  );
}

function DurationSlider({
  min,
  max,
  value,
  onChange
}: {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const progress = max > min ? (value - min) / (max - min) : 1;

  return (
    <div className="relative pt-0.5">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-200" />
      <div
        className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-zinc-900"
        style={{ width: `${progress * 100}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          "relative z-10 h-8 w-full cursor-pointer appearance-none bg-transparent",
          "[&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-transparent",
          "[&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10",
          "[&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-none",
          "[&::-webkit-slider-thumb]:bg-[radial-gradient(circle,white_2px,#18181b_2px)]",
          "[&::-moz-range-track]:h-px [&::-moz-range-track]:bg-transparent",
          "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
          "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-none",
          "[&::-moz-range-thumb]:bg-[radial-gradient(circle,white_2px,#18181b_2px)]"
        )}
      />
    </div>
  );
}

function allowedAspectRatios(capabilities: PublicAiModelCapabilities) {
  const allowed =
    capabilities.supportedAspectRatios.length === 0
      ? [...VIDEO_ASPECT_RATIOS]
      : capabilities.supportedAspectRatios;
  return VIDEO_ASPECT_RATIOS.filter((ratio) => allowed.includes(ratio));
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

export function GenerationVideoSettingsPanel({
  locale,
  settings,
  capabilities,
  onChange
}: {
  locale: Locale;
  settings: VideoGenerationSettings;
  capabilities: PublicAiModelCapabilities;
  onChange: (settings: VideoGenerationSettings) => void;
}) {
  const t = copy[locale];
  const aspectRatios = allowedAspectRatios(capabilities);
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
    <div className={SETTINGS_PANEL_SHELL_CLASS}>
      <div className="space-y-5">
        {aspectRatios.length > 0 ? (
          <div>
            <div className="mb-2.5 text-sm font-medium text-zinc-800">{t.aspectRatio}</div>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map((ratio) => (
                <AspectRatioCard
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
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span className="text-zinc-800">{t.duration}</span>
            <span className="tabular-nums text-zinc-400">{settings.duration}s</span>
          </div>
          <DurationSlider
            min={durationConfig.min}
            max={durationConfig.max}
            value={settings.duration}
            onChange={setDuration}
          />
        </div>
      </div>
    </div>
  );
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
  return (
    <div className="absolute bottom-full left-0 z-[120] mb-2 w-[min(340px,calc(100vw-32px))]">
      <GenerationVideoSettingsPanel
        locale={locale}
        settings={settings}
        capabilities={capabilities}
        onChange={onChange}
      />
    </div>
  );
}

export { DEFAULT_VIDEO_SETTINGS };
