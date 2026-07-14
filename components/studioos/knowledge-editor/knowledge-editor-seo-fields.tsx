"use client";

import { KnowledgeImeInput } from "@/components/studioos/knowledge-editor/knowledge-ime-input";
import type { KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import type { Locale } from "@/lib/i18n";
import { Sparkles } from "lucide-react";

type Props = {
  locale: Locale;
  form: Pick<KnowledgeEditorPanelForm, "focus_keywords">;
  onChange: (patch: Partial<Props["form"]>) => void;
  generating?: boolean;
  generateDisabled?: boolean;
  onGenerate?: () => void;
};

export function KnowledgeEditorSeoFields({ locale, form, onChange, generating, generateDisabled, onGenerate }: Props) {
  const zh = locale === "zh";

  return (
    <div className="mb-4 border-b border-zinc-100 pb-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-zinc-700">{zh ? "焦点关键词" : "Focus keywords"}</label>
        {onGenerate ? (
          <button
            type="button"
            disabled={generateDisabled || generating}
            onClick={onGenerate}
            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generating ? (zh ? "生成中…" : "Generating…") : zh ? "AI 生成" : "AI generate"}
          </button>
        ) : null}
      </div>
      <KnowledgeImeInput
        value={form.focus_keywords}
        onValueChange={(focus_keywords) => onChange({ focus_keywords })}
        placeholder={zh ? "逗号分隔，如：AI 广告, 视频营销" : "Comma-separated, e.g. AI ads, video marketing"}
      />
    </div>
  );
}
