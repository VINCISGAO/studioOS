"use client";

import { Sparkles, Wand2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    lyrics: "歌词",
    instrumental: "器乐",
    lyricsPlaceholder: "在此输入歌词，或留空以使用伴奏。",
    optimize: "优化",
    generateLyrics: "生成歌词"
  },
  en: {
    lyrics: "Lyrics",
    instrumental: "Instrumental",
    lyricsPlaceholder: "Enter lyrics here, or leave blank for accompaniment.",
    optimize: "Optimize",
    generateLyrics: "Generate lyrics"
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
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full transition",
        checked ? "bg-zinc-900" : "bg-zinc-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-4"
        )}
      />
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
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-zinc-700">{t.lyrics}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">{t.instrumental}</span>
          <Toggle checked={instrumental} onChange={onInstrumentalChange} label={t.instrumental} />
        </div>
      </div>
      <textarea
        value={lyrics}
        onChange={(event) => onLyricsChange(event.target.value)}
        rows={4}
        maxLength={3000}
        disabled={instrumental}
        placeholder={t.lyricsPlaceholder}
        className={cn(
          "min-h-[96px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400",
          instrumental && "cursor-not-allowed opacity-50"
        )}
      />
      {!instrumental ? (
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-600"
          >
            <Wand2 className="h-3 w-3" />
            {t.optimize}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-600"
          >
            <Sparkles className="h-3 w-3" />
            {t.generateLyrics}
          </button>
        </div>
      ) : null}
    </section>
  );
}
