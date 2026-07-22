"use client";

import { Info, Link2 } from "lucide-react";
import type { PublicAiModelCapabilities } from "@/features/canvas/ai-model-catalog.types";
import {
  IMAGE_ASPECT_RATIOS,
  IMAGE_QUALITY_TIERS,
  applyImageAspectRatio,
  formatImageAspectRatioLabel,
  formatImageQualityLabel,
  type ImageAspectRatioId,
  type ImageGenerationSettings
} from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    title: "图像设置",
    quality: "质量",
    size: "尺寸",
    ratio: "宽高比",
    outputs: "输出数量"
  },
  en: {
    title: "Image settings",
    quality: "Quality",
    size: "Dimensions",
    ratio: "Aspect ratio",
    outputs: "Outputs"
  }
} as const;

function RatioIcon({ ratio }: { ratio: string }) {
  if (ratio === "auto") return null;
  const sizes: Record<string, string> = {
    "1:1": "h-4 w-4",
    "3:2": "h-3 w-5",
    "2:3": "h-5 w-3",
    "4:3": "h-3.5 w-4.5",
    "3:4": "h-4.5 w-3.5",
    "9:16": "h-5 w-2.5",
    "16:9": "h-3 w-5"
  };
  const key = ratio.includes("_") ? ratio.split("_")[0] ?? "1:1" : ratio;
  return <span className={cn("rounded-sm border border-zinc-400 bg-zinc-100", sizes[key] ?? "h-4 w-4")} />;
}

function allowedAspectRatios(capabilities: PublicAiModelCapabilities): ImageAspectRatioId[] {
  if (capabilities.supportedAspectRatios.length === 0) return IMAGE_ASPECT_RATIOS;
  return IMAGE_ASPECT_RATIOS.filter((ratio) => capabilities.supportedAspectRatios.includes(ratio));
}

export function GenerationImageSettingsPopover({
  locale,
  settings,
  capabilities,
  onChange
}: {
  locale: Locale;
  settings: ImageGenerationSettings;
  capabilities: PublicAiModelCapabilities;
  onChange: (settings: ImageGenerationSettings) => void;
  onClose?: () => void;
}) {
  const t = copy[locale];
  const aspectRatios = allowedAspectRatios(capabilities);
  const maxOutputs = Math.max(1, capabilities.maxOutputCount);

  return (
    <div className="absolute bottom-full right-0 z-50 mb-2 w-[300px] max-w-[calc(100vw-32px)] rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl">
      <h3 className="mb-4 text-sm font-semibold text-zinc-950">{t.title}</h3>

      <div className="space-y-5">
        <div>
          <div className="mb-2 text-xs font-medium text-zinc-700">{t.quality}</div>
          <div className="flex flex-wrap gap-2">
            {IMAGE_QUALITY_TIERS.map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => onChange({ ...settings, quality })}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition",
                  settings.quality === quality
                    ? "border-zinc-900 bg-white text-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                )}
              >
                {formatImageQualityLabel(quality, locale)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium text-zinc-700">
            {t.size}
            <Info className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2">
              <span className="text-xs text-zinc-400">W</span>
              <input
                type="number"
                min={512}
                max={4096}
                value={settings.width}
                onChange={(event) => {
                  const width = Number(event.target.value);
                  if (!Number.isFinite(width) || width <= 0) return;
                  onChange({
                    ...settings,
                    width,
                    height:
                      settings.lockAspect && settings.width > 0
                        ? Math.round((width / settings.width) * settings.height)
                        : settings.height
                  });
                }}
                className="w-full bg-transparent text-sm text-zinc-900 outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => onChange({ ...settings, lockAspect: !settings.lockAspect })}
              className={cn(
                "rounded-lg p-2",
                settings.lockAspect ? "text-zinc-900" : "text-zinc-400"
              )}
            >
              <Link2 className="h-4 w-4" />
            </button>
            <label className="flex flex-1 items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2">
              <span className="text-xs text-zinc-400">H</span>
              <input
                type="number"
                min={512}
                max={4096}
                value={settings.height}
                onChange={(event) => {
                  const height = Number(event.target.value);
                  if (!Number.isFinite(height) || height <= 0) return;
                  onChange({
                    ...settings,
                    height,
                    width:
                      settings.lockAspect && settings.height > 0
                        ? Math.round((height / settings.height) * settings.width)
                        : settings.width
                  });
                }}
                className="w-full bg-transparent text-sm text-zinc-900 outline-none"
              />
            </label>
          </div>
        </div>

        {aspectRatios.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center gap-1 text-xs font-medium text-zinc-700">
              {t.ratio}
              <Info className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => onChange(applyImageAspectRatio(settings, ratio))}
                  className={cn(
                    "flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-xl border px-2 py-2.5 text-[11px] transition",
                    settings.aspectRatio === ratio
                      ? "border-zinc-900 bg-white text-zinc-900"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                  )}
                >
                  <RatioIcon ratio={ratio} />
                  <span>{formatImageAspectRatioLabel(ratio)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {maxOutputs > 1 ? (
          <div>
            <div className="mb-2 text-xs font-medium text-zinc-700">{t.outputs}</div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: maxOutputs }, (_, index) => index + 1).map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onChange({ ...settings, outputs: count })}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition",
                    settings.outputs === count
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
