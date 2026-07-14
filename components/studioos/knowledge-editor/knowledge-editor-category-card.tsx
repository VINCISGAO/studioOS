"use client";

import { KNOWLEDGE_EDITOR_CATEGORIES, KNOWLEDGE_TAG_SUGGESTIONS } from "@/lib/knowledge/knowledge-editor.constants";
import { knowledgeEditorCategoryLabel, knowledgeEditorTagSuggestionLabel } from "@/lib/knowledge/knowledge-editor-copy";
import type { Locale } from "@/lib/i18n";
import { X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function KnowledgeEditorCategoryCard({
  locale,
  categorySlug,
  tags,
  onCategoryChange,
  onTagsChange
}: {
  locale: Locale;
  categorySlug: string;
  tags: string[];
  onCategoryChange: (slug: string) => void;
  onTagsChange: (tags: string[]) => void;
}) {
  const zh = locale === "zh";
  const [tagInput, setTagInput] = useState("");

  function addTag(raw: string) {
    const next = raw.trim();
    if (!next) return;
    if (tags.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    onTagsChange([...tags, next]);
    setTagInput("");
  }

  const suggestions = KNOWLEDGE_TAG_SUGGESTIONS.filter(
    (item) => !tags.some((tag) => tag.toLowerCase() === item.toLowerCase())
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">{zh ? "分类 & 标签" : "Category & Tags"}</h3>
      <div className="mt-3 space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-600">{zh ? "分类" : "Category"}</label>
          <select
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            value={categorySlug}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">{zh ? "选择分类" : "Select category"}</option>
            {KNOWLEDGE_EDITOR_CATEGORIES.map((item) => (
              <option key={item.slug} value={item.slug}>
                {knowledgeEditorCategoryLabel(item.slug, zh)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">{zh ? "标签" : "Tags"}</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-[#5B5CEB]">
                {tag}
                <button type="button" onClick={() => onTagsChange(tags.filter((item) => item !== tag))} aria-label={zh ? `移除标签 ${tag}` : `Remove ${tag}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <Input
            className="mt-2"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder={zh ? "输入后回车添加" : "Type and press Enter"}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.slice(0, 6).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => addTag(item)}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:border-violet-200 hover:text-[#5B5CEB]"
              >
                + {knowledgeEditorTagSuggestionLabel(item, zh)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
