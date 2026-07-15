"use client";

import {
  KnowledgeEditorCard,
  KnowledgeEditorFieldLabel,
  KnowledgeEditorIconSelect
} from "@/components/studioos/knowledge-editor/knowledge-editor-ui-primitives";
import { KnowledgeImeInput, KnowledgeImeTextarea } from "@/components/studioos/knowledge-editor/knowledge-ime-input";
import { KNOWLEDGE_EDITOR_LANGUAGE_OPTIONS } from "@/lib/knowledge/knowledge-editor.constants";
import type { KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import type { Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { useState } from "react";

type Props = {
  locale: Locale;
  form: Pick<KnowledgeEditorPanelForm, "title" | "subtitle" | "language_code">;
  onChange: (patch: Partial<Props["form"]>) => void;
  onTitleChange: (title: string) => void;
};

export function KnowledgeEditorArticleFields({ locale, form, onChange, onTitleChange }: Props) {
  const zh = locale === "zh";
  const [titleDraft, setTitleDraft] = useState(form.title);
  const [subtitleDraft, setSubtitleDraft] = useState(form.subtitle);

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
