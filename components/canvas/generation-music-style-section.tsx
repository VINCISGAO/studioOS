"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, RefreshCw, Wand2 } from "lucide-react";
import { GenerationCharCount, generationFieldHint } from "@/components/canvas/generation-char-count";
import { useCanvasPromptEnhance } from "@/components/canvas/hooks/use-canvas-prompt-enhance";
import { MUSIC_STYLE_TAGS } from "@/lib/canvas/generation-ui";
import {
  MUSIC_STYLE_MAX,
  MUSIC_STYLE_WARN_AT
} from "@/lib/canvas/music-field-limits";
import {
  musicPanelEnhanceButtonClass,
  musicPanelFieldShellClass,
  musicPanelRefreshButtonClass,
  musicPanelSectionLabelClass,
  musicPanelStyleTextareaClass,
  musicPanelStyleToolbarClass,
  musicPanelTagClass
} from "@/lib/canvas/music-panel-design";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  zh: {
    style: "风格",
    stylePlaceholder: "输入风格、情绪、乐器等信息来控制生成的音乐。",
    enhance: "智能优化"
  },
  en: {
    style: "Style",
    stylePlaceholder: "Enter style, mood, instruments, etc. to control the generated music.",
    enhance: "Smart optimize"
  }
} as const;

function appendTag(current: string, tag: string) {
  if (!tag) return current;
  if (current.includes(tag)) return current;
  return current.trim() ? `${current.trim()}，${tag}` : tag;
}

export function GenerationMusicStyleSection({
  locale,
  projectId,
  style,
  onStyleChange
}: {
  locale: Locale;
  projectId: string;
  style: string;
  onStyleChange: (value: string) => void;
}) {
  const t = copy[locale];
  const [tagSeed, setTagSeed] = useState(0);
  const { enhance, enhancing, error, clearError } = useCanvasPromptEnhance(projectId, locale);
  const tags = locale === "zh" ? MUSIC_STYLE_TAGS.zh : MUSIC_STYLE_TAGS.en;
  const visibleTags = useMemo(() => {
    const offset = tagSeed % tags.length;
    return [...tags.slice(offset), ...tags.slice(0, offset)].slice(0, 5);
  }, [tagSeed, tags]);

  async function handleEnhance() {
    clearError();
    const enhanced = await enhance("music_style", style);
    if (enhanced) {
      onStyleChange(enhanced);
    }
  }

  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className={musicPanelSectionLabelClass}>{t.style}</span>
        <span className="text-[10px] text-zinc-400">{generationFieldHint(MUSIC_STYLE_MAX, locale)}</span>
      </div>
      <div className={musicPanelFieldShellClass}>
        <div className="relative">
          <textarea
            value={style}
            onChange={(event) => {
              clearError();
              onStyleChange(event.target.value);
            }}
            rows={3}
            maxLength={MUSIC_STYLE_MAX}
            placeholder={t.stylePlaceholder}
            className={musicPanelStyleTextareaClass}
          />
          <GenerationCharCount
            length={style.length}
            max={MUSIC_STYLE_MAX}
            warnAt={MUSIC_STYLE_WARN_AT}
            locale={locale}
          />
        </div>
        <div className={musicPanelStyleToolbarClass}>
          <button
            type="button"
            disabled={enhancing || !style.trim()}
            onClick={() => void handleEnhance()}
            className={cn(
              musicPanelEnhanceButtonClass,
              (enhancing || !style.trim()) && "cursor-not-allowed opacity-50"
            )}
          >
            {enhancing ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {t.enhance}
          </button>
          <button
            type="button"
            onClick={() => setTagSeed((value) => value + 1)}
            className={musicPanelRefreshButtonClass}
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
                className={musicPanelTagClass}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error ? <p className="mt-2 text-[11px] text-rose-600">{error}</p> : null}
    </section>
  );
}
