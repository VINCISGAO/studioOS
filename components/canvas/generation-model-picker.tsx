"use client";

import { BarChart3, Check, Sparkles } from "lucide-react";
import { VIDEO_MODELS, type VideoModelId } from "@/lib/canvas/generation-ui";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function ProviderIcon({ provider }: { provider: "seedance" | "kling" | "veo" | "gemini" }) {
  if (provider === "gemini") return <Sparkles className="h-4 w-4 text-zinc-700" />;
  if (provider === "veo") {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-400 text-[8px] font-bold">
        G
      </span>
    );
  }
  if (provider === "kling") {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-400 text-[8px] font-bold">
        K
      </span>
    );
  }
  return <BarChart3 className="h-4 w-4 text-zinc-700" />;
}

export function GenerationModelPicker({
  locale,
  selectedModel,
  onSelect,
  onClose
}: {
  locale: Locale;
  selectedModel: VideoModelId;
  onSelect: (modelId: VideoModelId) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full right-0 z-50 mb-2 max-h-[320px] w-[min(92vw,300px)] overflow-y-auto rounded-2xl border border-zinc-200 bg-white py-1 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-zinc-500">
          {locale === "zh" ? "选择模型" : "Choose model"}
        </span>
        <button type="button" onClick={onClose} className="text-[11px] text-zinc-400 hover:text-zinc-700">
          {locale === "zh" ? "关闭" : "Close"}
        </button>
      </div>
      {VIDEO_MODELS.map((model) => {
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
              "flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-zinc-50",
              active && "bg-zinc-50"
            )}
          >
            <ProviderIcon provider={model.provider} />
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-900">{model.label}</span>
            {model.memberOnly ? (
              <span className="shrink-0 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-600">
                {locale === "zh" ? "会员专属" : "Member"}
              </span>
            ) : null}
            {active ? <Check className="h-4 w-4 shrink-0 text-zinc-900" /> : null}
          </button>
        );
      })}
    </div>
  );
}
