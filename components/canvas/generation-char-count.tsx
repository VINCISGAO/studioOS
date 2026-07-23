"use client";

import { musicPanelCharCountClass } from "@/lib/canvas/music-panel-design";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function GenerationCharCount({
  length,
  max,
  warnAt,
  locale,
  className
}: {
  length: number;
  max: number;
  warnAt: number;
  locale: Locale;
  className?: string;
}) {
  const overLimit = length > max;
  const warnZone = length > warnAt && length <= max;

  return (
    <span
      className={cn(
        musicPanelCharCountClass,
        overLimit ? "text-rose-500" : warnZone ? "text-orange-500" : "text-zinc-400",
        className
      )}
    >
      {length} / {max}
    </span>
  );
}

export function generationFieldHint(max: number, locale: Locale) {
  return locale === "zh" ? `最多可输入 ${max} 个字符` : `Maximum ${max} characters`;
}
