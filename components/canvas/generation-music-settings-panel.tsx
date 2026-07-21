"use client";

import { ChevronDown, LoaderCircle, Mic2, Plus, X, Zap } from "lucide-react";
import { GenerationMusicLyricsSection } from "@/components/canvas/generation-music-lyrics-section";
import { GenerationMusicStyleSection } from "@/components/canvas/generation-music-style-section";
import {
  MUSIC_MODELS,
  type MusicCreationMode,
  type MusicGenerationSettings,
  type MusicModelVersion,
  type VocalGender
} from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    simple: "简单",
    custom: "自定义",
    soundtrack: "原声带",
    reference: "参考",
    remix: "混音版",
    vocal: "声乐",
    vocalGender: "声乐性别",
    female: "女性",
    male: "男性",
    songName: "输入歌曲名称",
    simpleHint: "简单模式：只需填写风格即可快速生成。",
    generate: "生成音乐",
    close: "关闭"
  },
  en: {
    simple: "Simple",
    custom: "Custom",
    soundtrack: "Soundtrack",
    reference: "Reference",
    remix: "Remix",
    vocal: "Vocal",
    vocalGender: "Vocal gender",
    female: "Female",
    male: "Male",
    songName: "Enter song name",
    simpleHint: "Simple mode: fill in style to generate quickly.",
    generate: "Generate music",
    close: "Close"
  }
} as const;

export function GenerationMusicSettingsPanel({
  locale,
  settings,
  settingsLabel,
  generating,
  submitDisabled,
  credits,
  onChange,
  onClose,
  onSubmit
}: {
  locale: Locale;
  settings: MusicGenerationSettings;
  settingsLabel: string;
  generating: boolean;
  submitDisabled: boolean;
  credits: number;
  onChange: (settings: MusicGenerationSettings) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const t = copy[locale];

  function patch(partial: Partial<MusicGenerationSettings>) {
    onChange({ ...settings, ...partial });
  }

  function setMode(mode: MusicCreationMode) {
    patch({
      mode,
      instrumental: mode === "soundtrack" ? true : settings.instrumental
    });
  }

  function toggleQuickFlag(key: "referenceEnabled" | "remixEnabled" | "vocalEnabled") {
    patch({ [key]: !settings[key] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {(["simple", "custom", "soundtrack"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              className={cn(
                "border-b-2 pb-1.5 text-[13px] font-medium transition",
                settings.mode === mode
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              )}
            >
              {mode === "simple" ? t.simple : mode === "custom" ? t.custom : t.soundtrack}
            </button>
          ))}
        </div>
        <label className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-600">
          <select
            value={settings.modelVersion}
            onChange={(event) =>
              patch({ modelVersion: event.target.value as MusicModelVersion })
            }
            className="max-w-[108px] bg-transparent text-[11px] outline-none"
          >
            {MUSIC_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label[locale === "zh" ? "zh" : "en"]}
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </label>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          aria-label={t.close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "referenceEnabled" as const, label: t.reference },
          { key: "remixEnabled" as const, label: t.remix },
          { key: "vocalEnabled" as const, label: t.vocal }
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleQuickFlag(key)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] transition",
              settings[key]
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {settings.mode !== "simple" ? (
        <GenerationMusicLyricsSection
          locale={locale}
          lyrics={settings.lyrics}
          instrumental={settings.instrumental}
          onLyricsChange={(lyrics) => patch({ lyrics })}
          onInstrumentalChange={(instrumental) => patch({ instrumental })}
        />
      ) : null}

      <GenerationMusicStyleSection
        locale={locale}
        style={settings.style}
        onStyleChange={(style) => patch({ style })}
      />

      {!settings.instrumental && settings.mode !== "simple" ? (
        <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3">
          <span className="text-[12px] font-medium text-zinc-700">{t.vocalGender}</span>
          <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-0.5">
            {(["female", "male"] as VocalGender[]).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => patch({ vocalGender: gender })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] transition",
                  settings.vocalGender === gender
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                {gender === "female" ? t.female : t.male}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative">
        <input
          value={settings.songName}
          onChange={(event) => patch({ songName: event.target.value.slice(0, 50) })}
          maxLength={50}
          placeholder={t.songName}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 pr-14 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[11px] text-zinc-400">
          {settings.songName.length}/50
        </span>
      </div>

      {settings.mode === "simple" ? (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-zinc-200 px-4 py-3 text-[12px] text-zinc-500">
          <Mic2 className="h-4 w-4 shrink-0" />
          {t.simpleHint}
        </div>
      ) : null}

      <div className="flex items-center gap-3 border-t border-zinc-100 pt-4">
        <span className="inline-flex min-w-0 flex-1 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600">
          <span className="truncate">{settingsLabel}</span>
        </span>
        <button
          type="button"
          disabled={submitDisabled}
          onClick={onSubmit}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-black disabled:opacity-40"
        >
          {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {t.generate}
          <span className="text-zinc-300">·</span>
          {credits}
        </button>
      </div>
    </div>
  );
}
