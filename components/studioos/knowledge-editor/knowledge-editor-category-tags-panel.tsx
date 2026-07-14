"use client";

import { KnowledgeEditorCard, KnowledgeEditorFieldLabel } from "@/components/studioos/knowledge-editor/knowledge-editor-ui-primitives";
import { KNOWLEDGE_EDITOR_CATEGORIES, KNOWLEDGE_TAG_SUGGESTIONS } from "@/lib/knowledge/knowledge-editor.constants";
import { knowledgeEditorCategoryLabel, knowledgeEditorTagSuggestionLabel } from "@/lib/knowledge/knowledge-editor-copy";
import type { KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import type { Locale } from "@/lib/i18n";
import { X } from "lucide-react";
import { useState } from "react";

type Props = {
  locale: Locale;
  form: Pick<KnowledgeEditorPanelForm, "category_slug" | "tags">;
  onChange: (patch: Partial<Props["form"]>) => void;
};

export function KnowledgeEditorCategoryTagsPanel({ locale, form, onChange }: Props) {
  const zh = locale === "zh";
  const [tagInput, setTagInput] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || form.tags.includes(tag)) return;
    onChange({ tags: [...form.tags, tag] });
    setTagInput("");
  }

  function removeTag(tag: string) {
    onChange({ tags: form.tags.filter((item) => item !== tag) });
  }

  return (
    <KnowledgeEditorCard title={zh ? "分类 & 标签" : "Category & tags"}>
      <div className="space-y-4">
        <div className="min-w-0">
          <KnowledgeEditorFieldLabel label={zh ? "分类" : "Category"} required />
          <select
            className="h-11 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            value={form.category_slug}
            onChange={(event) => onChange({ category_slug: event.target.value })}
          >
            <option value="">{zh ? "选择分类" : "Select category"}</option>
            {KNOWLEDGE_EDITOR_CATEGORIES.map((item) => (
              <option key={item.slug} value={item.slug}>
                {knowledgeEditorCategoryLabel(item.slug, zh)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <KnowledgeEditorFieldLabel label={zh ? "标签" : "Tags"} />
          <div className="flex min-h-11 min-w-0 flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-2">
            {form.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                {knowledgeEditorTagSuggestionLabel(tag, zh)}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder={zh ? "输入后回车添加" : "Press Enter to add"}
              className="min-w-0 flex-1 basis-[120px] border-0 bg-transparent px-1 text-sm outline-none"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {KNOWLEDGE_TAG_SUGGESTIONS.slice(0, 6).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:border-violet-200 hover:bg-violet-50"
              >
                {knowledgeEditorTagSuggestionLabel(tag, zh)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </KnowledgeEditorCard>
  );
}
