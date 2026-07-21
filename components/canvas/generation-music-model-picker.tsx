"use client";

import { Check } from "lucide-react";
import { MUSIC_MODELS, type MusicModelVersion } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function GenerationMusicModelPicker({
  locale,
  selectedModel,
  onSelect,
  onClose
}: {
  locale: Locale;
  selectedModel: MusicModelVersion;
  onSelect: (modelId: MusicModelVersion) => void;
  onClose: () => void;
}) {
  const lang = locale === "zh" ? "zh" : "en";

  return (
    <div className="absolute bottom-full right-0 z-50 mb-2 w-[min(92vw,220px)] overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-zinc-500">
          {locale === "zh" ? "模型版本" : "Model version"}
        </span>
        <button type="button" onClick={onClose} className="text-[11px] text-zinc-400 hover:text-zinc-700">
          {locale === "zh" ? "关闭" : "Close"}
        </button>
      </div>
      {MUSIC_MODELS.map((model) => {
        const active = model.id === selectedModel;
        return (
          <button
            key={model.id}
            type="button"
            onClick={() => {
              onSelect(model.id);
              onClose();
            }}
            className={cn(
              "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-zinc-50",
              active && "bg-zinc-50"
            )}
          >
            <span className="text-zinc-900">{model.label[lang]}</span>
            {active ? <Check className="h-4 w-4 text-zinc-900" /> : null}
          </button>
        );
      })}
    </div>
  );
}
