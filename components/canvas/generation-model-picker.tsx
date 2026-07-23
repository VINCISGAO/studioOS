"use client";

import { BarChart3, Check } from "lucide-react";
import type { PublicAiModelView } from "@/features/canvas/ai-model-catalog.types";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function GenerationModelPicker({
  locale,
  models,
  selectedModel,
  onSelect,
  onClose
}: {
  locale: Locale;
  models: PublicAiModelView[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white py-1 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-zinc-500">
          {locale === "zh" ? "选择模型" : "Choose model"}
        </span>
        <button type="button" onClick={onClose} className="text-[11px] text-zinc-400 hover:text-zinc-700">
          {locale === "zh" ? "关闭" : "Close"}
        </button>
      </div>
      {models.length === 0 ? (
        <p className="px-3 py-4 text-xs text-zinc-500">
          {locale === "zh" ? "暂无可用模型" : "No models available"}
        </p>
      ) : null}
      {models.map((model) => {
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
            <BarChart3 className="h-4 w-4 shrink-0 text-zinc-700" />
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-900">{model.displayName}</span>
            {model.recommended ? (
              <span className="shrink-0 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-600">
                {locale === "zh" ? "推荐" : "Recommended"}
              </span>
            ) : null}
            {active ? <Check className="h-4 w-4 shrink-0 text-zinc-900" /> : null}
          </button>
        );
      })}
    </div>
  );
}
