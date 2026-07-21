"use client";

import {
  DEFAULT_VIDEO_SETTINGS,
  VIDEO_ASPECT_RATIOS,
  VIDEO_QUALITIES,
  type VideoGenerationSettings
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
    webSearch: "网络搜索",
    auto: "Auto"
  },
  en: {
    title: "Video settings",
    aspectRatio: "Aspect ratio",
    duration: "Duration",
    quality: "Quality",
    audio: "Audio",
    webSearch: "Web search",
    auto: "Auto"
  }
} as const;

function RatioIcon({ ratio }: { ratio: string }) {
  const sizes: Record<string, string> = {
    auto: "h-5 w-5 rounded-md",
    "16:9": "h-3.5 w-6 rounded-sm",
    "4:3": "h-4 w-5 rounded-sm",
    "1:1": "h-4 w-4 rounded-sm",
    "3:4": "h-5 w-3.5 rounded-sm",
    "9:16": "h-6 w-3.5 rounded-sm",
    "21:9": "h-2.5 w-7 rounded-sm"
  };
  return <span className={cn("border border-zinc-400 bg-zinc-100", sizes[ratio] ?? sizes.auto)} />;
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

export function GenerationVideoSettingsPopover({
  locale,
  settings,
  onChange
}: {
  locale: Locale;
  settings: VideoGenerationSettings;
  onChange: (settings: VideoGenerationSettings) => void;
  onClose?: () => void;
}) {
  const t = copy[locale];

  return (
    <div className="absolute bottom-full right-0 z-50 mb-2 w-[300px] max-w-[calc(100vw-32px)] rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl">
      <h3 className="mb-4 text-sm font-semibold text-zinc-950">{t.title}</h3>

      <div className="space-y-5">
        <div>
          <div className="mb-2 text-xs font-medium text-zinc-700">{t.aspectRatio}</div>
          <div className="grid grid-cols-4 gap-2">
            {VIDEO_ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => onChange({ ...settings, aspectRatio: ratio })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-[11px] transition",
                  settings.aspectRatio === ratio
                    ? "border-zinc-900 bg-zinc-50 text-zinc-900"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                )}
              >
                <RatioIcon ratio={ratio} />
                {ratio === "auto" ? t.auto : ratio}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-700">
            <span>{t.duration}</span>
            <span>{settings.duration}s</span>
          </div>
          <input
            type="range"
            min={3}
            max={15}
            step={1}
            value={settings.duration}
            onChange={(event) =>
              onChange({ ...settings, duration: Number(event.target.value) })
            }
            className="w-full accent-zinc-900"
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-zinc-700">{t.quality}</div>
          <div className="flex flex-wrap gap-2">
            {VIDEO_QUALITIES.map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => onChange({ ...settings, quality })}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-medium transition",
                  settings.quality === quality
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                )}
              >
                {quality}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-zinc-100 pt-3">
          <Toggle
            label={t.audio}
            checked={settings.audio}
            onChange={(audio) => onChange({ ...settings, audio })}
          />
          <Toggle
            label={t.webSearch}
            checked={settings.webSearch}
            onChange={(webSearch) => onChange({ ...settings, webSearch })}
          />
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_VIDEO_SETTINGS };
