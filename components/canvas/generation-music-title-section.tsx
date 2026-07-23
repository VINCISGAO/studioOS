"use client";

import { GenerationCharCount, generationFieldHint } from "@/components/canvas/generation-char-count";
import {
  MUSIC_TITLE_MAX,
  MUSIC_TITLE_WARN_AT
} from "@/lib/canvas/music-field-limits";
import {
  musicPanelFieldShellClass,
  musicPanelSectionLabelClass
} from "@/lib/canvas/music-panel-design";
import type { Locale } from "@/lib/i18n";

const copy = {
  zh: {
    title: "标题",
    placeholder: "为这首音乐取一个名字（可选）"
  },
  en: {
    title: "Title",
    placeholder: "Name this track (optional)"
  }
} as const;

export function GenerationMusicTitleSection({
  locale,
  songName,
  onSongNameChange
}: {
  locale: Locale;
  songName: string;
  onSongNameChange: (value: string) => void;
}) {
  const t = copy[locale];
  const length = songName.length;

  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className={musicPanelSectionLabelClass}>{t.title}</span>
        <span className="text-[10px] text-zinc-400">{generationFieldHint(MUSIC_TITLE_MAX, locale)}</span>
      </div>
      <div className={musicPanelFieldShellClass}>
        <input
          type="text"
          value={songName}
          onChange={(event) => onSongNameChange(event.target.value)}
          maxLength={MUSIC_TITLE_MAX}
          placeholder={t.placeholder}
          className="w-full border-0 bg-transparent px-3.5 pb-7 pt-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0"
        />
        <GenerationCharCount
          length={length}
          max={MUSIC_TITLE_MAX}
          warnAt={MUSIC_TITLE_WARN_AT}
          locale={locale}
        />
      </div>
    </section>
  );
}
