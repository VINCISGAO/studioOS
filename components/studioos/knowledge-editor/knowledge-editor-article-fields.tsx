"use client";

import {
  KnowledgeEditorCard,
  KnowledgeEditorFieldLabel,
  KnowledgeEditorIconSelect
} from "@/components/studioos/knowledge-editor/knowledge-editor-ui-primitives";
import { KnowledgeImeInput, KnowledgeImeTextarea } from "@/components/studioos/knowledge-editor/knowledge-ime-input";
import { KNOWLEDGE_EDITOR_LANGUAGE_OPTIONS } from "@/lib/knowledge/knowledge-editor.constants";
import { knowledgeEditorSlugValidationMessage } from "@/lib/knowledge/knowledge-editor-copy";
import { buildKnowledgeEditorPublicPath } from "@/lib/knowledge/knowledge-editor-preview";
import type { KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import type { Locale } from "@/lib/i18n";
import { AlertCircle, CheckCircle2, Languages, Loader2 } from "lucide-react";
import { useState } from "react";

type SlugCheckState = {
  status: "idle" | "checking" | "available" | "taken" | "invalid";
  message: string | null;
};

type Props = {
  locale: Locale;
  form: Pick<KnowledgeEditorPanelForm, "title" | "slug" | "subtitle" | "language_code">;
  slugValidation: { ok: boolean; message?: string };
  slugCheck: SlugCheckState;
  onChange: (patch: Partial<Props["form"]>) => void;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
};

function SlugStatus({ locale, slugValidation, slugCheck }: { locale: Locale; slugValidation: Props["slugValidation"]; slugCheck: SlugCheckState }) {
  const zh = locale === "zh";

  if (!slugValidation.ok) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
        <AlertCircle className="h-3.5 w-3.5" />
        {knowledgeEditorSlugValidationMessage(slugValidation.message ?? "", zh)}
      </p>
    );
  }
  if (slugCheck.status === "checking") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {zh ? "正在检查 URL 别名…" : "Checking slug…"}
      </p>
    );
  }
  if (slugCheck.status === "available") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {zh ? "URL 别名可用" : "Slug is available"}
      </p>
    );
  }
  if (slugCheck.status === "taken" || slugCheck.status === "invalid") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600">
        <AlertCircle className="h-3.5 w-3.5" />
        {slugCheck.message ? knowledgeEditorSlugValidationMessage(slugCheck.message, zh) : zh ? "URL 别名不可用" : "Slug unavailable"}
      </p>
    );
  }
  return null;
}

export function KnowledgeEditorArticleFields({
  locale,
  form,
  slugValidation,
  slugCheck,
  onChange,
  onTitleChange,
  onSlugChange
}: Props) {
  const zh = locale === "zh";
  const [titleDraft, setTitleDraft] = useState(form.title);
  const [subtitleDraft, setSubtitleDraft] = useState(form.subtitle);
  const [slugDraft, setSlugDraft] = useState(form.slug);
  const publicPath = slugDraft ? buildKnowledgeEditorPublicPath(slugDraft, form.language_code) : "";

  return (
    <KnowledgeEditorCard title={zh ? "文章信息" : "Article info"}>
      <div className="space-y-4">
        <div>
          <KnowledgeEditorFieldLabel label={zh ? "源码语言" : "Source language"} />
          <KnowledgeEditorIconSelect
            icon={Languages}
            value={form.language_code}
            onChange={(event) => onChange({ language_code: event.target.value })}
          >
            {KNOWLEDGE_EDITOR_LANGUAGE_OPTIONS.map((item) => (
              <option key={item.code} value={item.code}>
                {zh ? item.zh : item.en}
              </option>
            ))}
          </KnowledgeEditorIconSelect>
        </div>

        <div>
          <KnowledgeEditorFieldLabel label={zh ? "标题" : "Title"} required counter={`${titleDraft.length} / 120`} />
          <KnowledgeImeInput
            value={form.title}
            onDraftChange={setTitleDraft}
            onValueChange={onTitleChange}
            placeholder={zh ? "请输入文章标题（建议不超过 120 字）" : "Article title (max 120 chars)"}
            maxLength={120}
          />
        </div>

        <div>
          <KnowledgeEditorFieldLabel label={zh ? "URL 别名" : "URL slug"} required counter={`${slugDraft.length} / 80`} />
          <KnowledgeImeInput
            value={form.slug}
            onDraftChange={setSlugDraft}
            onValueChange={onSlugChange}
            placeholder={zh ? "例如：ai-advertising-guide-2026" : "e.g. ai-advertising-guide-2026"}
            maxLength={80}
            className="font-mono"
          />
          <SlugStatus locale={locale} slugValidation={slugValidation} slugCheck={slugCheck} />
          <p className="mt-2 text-xs text-zinc-400">
            {slugDraft
              ? zh
                ? `将生成访问链接：${publicPath}`
                : `Public URL: ${publicPath}`
              : zh
                ? "填写后将显示访问链接"
                : "URL preview will appear here"}
          </p>
        </div>

        <div>
          <KnowledgeEditorFieldLabel
            label={zh ? "副标题（可选）" : "Subtitle (optional)"}
            counter={`${subtitleDraft.length} / 160`}
          />
          <KnowledgeImeTextarea
            value={form.subtitle}
            onDraftChange={setSubtitleDraft}
            onValueChange={(subtitle) => onChange({ subtitle })}
            placeholder={zh ? "请输入副标题（建议不超过 160 字）" : "Subtitle (max 160 chars)"}
            rows={2}
            maxLength={160}
          />
        </div>
      </div>
    </KnowledgeEditorCard>
  );
}
