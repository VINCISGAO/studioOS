"use client";

import { Sparkles } from "lucide-react";
import { generationPanelHintClass } from "@/lib/canvas/generation-panel-design";
import type { Locale } from "@/lib/i18n";

export function GenerationPanelPromptHint({ locale }: { locale: Locale }) {
  return (
    <div className={generationPanelHintClass}>
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      {locale === "zh" ? "输入至少 3 个字后可生成" : "Enter at least 3 characters to generate"}
    </div>
  );
}
