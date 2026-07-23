"use client";

import { GenerationCharCount, generationFieldHint } from "@/components/canvas/generation-char-count";
import type { Locale } from "@/lib/i18n";
import {
  MUSIC_LYRICS_MAX,
  MUSIC_LYRICS_WARN_AT
} from "@/lib/canvas/music-field-limits";
import {
  musicPanelFieldShellClass,
  musicPanelSectionLabelClass,
  musicPanelTextareaClass,
  musicPanelToggleThumbClass,
  musicPanelToggleTrackClass
} from "@/lib/canvas/music-panel-design";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    lyrics: "歌词",
    instrumental: "器乐",
    lyricsPlaceholder: "在此输入歌词，或留空以使用伴奏。"
  },
  en: {
    lyrics: "Lyrics",
    instrumental: "Instrumental",
    lyricsPlaceholder: "Enter lyrics here, or leave blank for accompaniment."
  }
} as const;

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
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={musicPanelToggleTrackClass(checked)}
    >
      <span className={cn(musicPanelToggleThumbClass, checked && "translate-x-4")} data-checked={checked} />
    </button>
  );
}

export function GenerationMusicLyricsSection({
  locale,
  lyrics,
  instrumental,
  onLyricsChange,
  onInstrumentalChange
}: {
  locale: Locale;
  lyrics: string;
  instrumental: boolean;
  onLyricsChange: (value: string) => void;
  onInstrumentalChange: (value: boolean) => void;
}) {
  const t = copy[locale];

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={musicPanelSectionLabelClass}>{t.lyrics}</span>
          {!instrumental ? (
            <span className="text-[10px] text-zinc-400">
              {generationFieldHint(MUSIC_LYRICS_MAX, locale)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">{t.instrumental}</span>
          <Toggle checked={instrumental} onChange={onInstrumentalChange} label={t.instrumental} />
        </div>
      </div>
      <div className={musicPanelFieldShellClass}>
        <textarea
          value={lyrics}
          onChange={(event) => onLyricsChange(event.target.value)}
          rows={4}
          maxLength={MUSIC_LYRICS_MAX}
          disabled={instrumental}
          placeholder={t.lyricsPlaceholder}
          className={cn(
            musicPanelTextareaClass,
            instrumental && "cursor-not-allowed opacity-50"
          )}
        />
        {!instrumental ? (
          <GenerationCharCount
            length={lyrics.length}
            max={MUSIC_LYRICS_MAX}
            warnAt={MUSIC_LYRICS_WARN_AT}
            locale={locale}
          />
        ) : null}
      </div>
    </section>
  );
}
