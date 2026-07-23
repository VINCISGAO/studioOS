"use client";

import { Info, LoaderCircle, Plus, X, Zap } from "lucide-react";
import { GenerationMusicLyricsSection } from "@/components/canvas/generation-music-lyrics-section";
import { GenerationMusicStyleSection } from "@/components/canvas/generation-music-style-section";
import { GenerationMusicTitleSection } from "@/components/canvas/generation-music-title-section";
import type { PublicAiModelCapabilities } from "@/features/canvas/ai-model-catalog.types";
import { musicModesForCapabilities } from "@/lib/canvas/ai-model-settings";
import {
  musicPanelActionChipClass,
  musicPanelCloseButtonClass,
  musicPanelFooterHintClass,
  musicPanelGenerateButtonClass,
  musicPanelTabClass
} from "@/lib/canvas/music-panel-design";
import { type MusicGenerationSettings } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";

const copy = {
  zh: {
    simple: "简单",
    custom: "自定义",
    reference: "参考",
    remix: "混音版",
    vocal: "声乐",
    simpleHint: "简单模式：只需填写风格即可快速生成。",
    generate: "生成音乐",
    close: "关闭"
  },
  en: {
    simple: "Simple",
    custom: "Custom",
    reference: "Reference",
    remix: "Remix",
    vocal: "Vocal",
    simpleHint: "Simple mode: fill in style to generate quickly.",
    generate: "Generate music",
    close: "Close"
  }
} as const;

const modeLabels: Record<"simple" | "custom", keyof (typeof copy)["zh"]> = {
  simple: "simple",
  custom: "custom"
};

export function GenerationMusicSettingsPanel({
  locale,
  projectId,
  settings,
  settingsLabel,
  capabilities,
  generating,
  submitDisabled,
  credits,
  onChange,
  onClose,
  onSubmit
}: {
  locale: Locale;
  projectId: string;
  settings: MusicGenerationSettings;
  settingsLabel: string;
  capabilities: PublicAiModelCapabilities | null;
  generating: boolean;
  submitDisabled: boolean;
  credits: number;
  onChange: (settings: MusicGenerationSettings) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const t = copy[locale];
  const allowedModes = capabilities ? musicModesForCapabilities(capabilities) : (["simple", "custom"] as const);

  function patch(partial: Partial<MusicGenerationSettings>) {
    onChange({ ...settings, ...partial });
  }

  function setMode(mode: "simple" | "custom") {
    patch({ mode });
  }

  function toggleQuickFlag(key: "referenceEnabled" | "remixEnabled" | "vocalEnabled") {
    patch({ [key]: !settings[key] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          {allowedModes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              className={musicPanelTabClass(settings.mode === mode)}
            >
              {t[modeLabels[mode]]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={musicPanelCloseButtonClass}
          aria-label={t.close}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "referenceEnabled" as const, label: t.reference },
          { key: "remixEnabled" as const, label: t.remix },
          { key: "vocalEnabled" as const, label: t.vocal, hidden: !capabilities?.supportsVocal }
        ]
          .filter((item) => !item.hidden)
          .map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleQuickFlag(key)}
              className={musicPanelActionChipClass(settings[key])}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
              {label}
            </button>
          ))}
      </div>

      <GenerationMusicTitleSection
        locale={locale}
        songName={settings.songName}
        onSongNameChange={(songName) => patch({ songName })}
      />

      {settings.mode === "custom" && capabilities?.supportsLyrics !== false ? (
        <GenerationMusicLyricsSection
          locale={locale}
          lyrics={settings.lyrics}
          instrumental={settings.instrumental}
          onLyricsChange={(lyrics) => patch({ lyrics })}
          onInstrumentalChange={(instrumental) => patch({ instrumental })}
        />
      ) : null}

      {capabilities?.supportsStyleTags !== false ? (
        <GenerationMusicStyleSection
          locale={locale}
          projectId={projectId}
          style={settings.style}
          onStyleChange={(style) => patch({ style })}
        />
      ) : null}

      {settings.mode === "simple" ? (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-4 py-3 text-[12px] text-zinc-500">
          {t.simpleHint}
        </div>
      ) : null}

      <div className="flex items-center gap-3 border-t border-zinc-100 pt-3">
        <span className={musicPanelFooterHintClass}>
          {settingsLabel}
          <Info className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2.25} />
        </span>
        <button
          type="button"
          disabled={submitDisabled}
          onClick={onSubmit}
          className={musicPanelGenerateButtonClass}
        >
          {generating ? (
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <Zap className="h-4 w-4" strokeWidth={2.25} />
          )}
          {t.generate} · {credits}
        </button>
      </div>
    </div>
  );
}
