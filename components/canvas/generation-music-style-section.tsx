"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Wand2 } from "lucide-react";
import { MUSIC_STYLE_TAGS } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";

const copy = {
  zh: {
    style: "风格",
    stylePlaceholder: "输入风格、情绪、乐器等信息来控制生成的音乐。",
    enhance: "提高"
  },
  en: {
    style: "Style",
    stylePlaceholder: "Enter style, mood, instruments, etc. to control the generated music.",
    enhance: "Enhance"
  }
} as const;

function appendTag(current: string, tag: string) {
  if (!tag) return current;
  if (current.includes(tag)) return current;
  return current.trim() ? `${current.trim()}，${tag}` : tag;
}

export function GenerationMusicStyleSection({
  locale,
  style,
  onStyleChange
}: {
  locale: Locale;
  style: string;
  onStyleChange: (value: string) => void;
}) {
  const t = copy[locale];
  const [tagSeed, setTagSeed] = useState(0);
  const tags = locale === "zh" ? MUSIC_STYLE_TAGS.zh : MUSIC_STYLE_TAGS.en;
  const visibleTags = useMemo(() => {
    const offset = tagSeed % tags.length;
    return [...tags.slice(offset), ...tags.slice(0, offset)].slice(0, 5);
  }, [tagSeed, tags]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5">
      <div className="mb-3 text-[12px] font-medium text-zinc-700">{t.style}</div>
      <textarea
        value={style}
        onChange={(event) => onStyleChange(event.target.value)}
        rows={4}
        maxLength={500}
        placeholder={t.stylePlaceholder}
        className="min-h-[96px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-600"
        >
          <Wand2 className="h-3.5 w-3.5" />
          {t.enhance}
        </button>
        <button
          type="button"
          onClick={() => setTagSeed((value) => value + 1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500"
          aria-label={locale === "zh" ? "刷新标签" : "Refresh tags"}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onStyleChange(appendTag(style, tag))}
              className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-600 hover:border-zinc-300"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
