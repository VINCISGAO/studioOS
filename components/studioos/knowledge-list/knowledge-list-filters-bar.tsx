"use client";

import { KNOWLEDGE_EDITOR_CATEGORIES } from "@/lib/knowledge/knowledge-editor.constants";
import { knowledgeEditorCategoryLabel } from "@/lib/knowledge/knowledge-editor-copy";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { Locale } from "@/lib/i18n";
import { Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";

export type KnowledgeListFilters = {
  query: string;
  category: string;
  status: string;
  language: string;
};

type Props = {
  locale: Locale;
  filters: KnowledgeListFilters;
  onChange: (patch: Partial<KnowledgeListFilters>) => void;
  onReset: () => void;
};

const STATUS_OPTIONS = [
  { value: "ALL", zh: "全部", en: "All" },
  { value: "PUBLISHED", zh: "已发布", en: "Published" },
  { value: "DRAFT", zh: "草稿", en: "Draft" }
] as const;

const LANGUAGE_OPTIONS = [
  { value: "ALL", zh: "全部", en: "All" },
  { value: "zh-CN", zh: "中文", en: "Chinese" },
  { value: "en", zh: "英文", en: "English" }
] as const;

export function KnowledgeListFiltersBar({ locale, filters, onChange, onReset }: Props) {
  const zh = locale === "zh";

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={filters.query}
          onChange={(event) => onChange({ query: event.target.value })}
          placeholder={zh ? "搜索标题、Slug、关键词…" : "Search title, slug, keywords…"}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:flex-1">
          <FilterSelect
            label={zh ? "分类" : "Category"}
            value={filters.category}
            onChange={(value) => onChange({ category: value })}
            options={[
              { value: "ALL", label: zh ? "全部" : "All" },
              ...KNOWLEDGE_EDITOR_CATEGORIES.map((item) => ({
                value: item.slug,
                label: knowledgeEditorCategoryLabel(item.slug, zh)
              }))
            ]}
          />
          <FilterSelect
            label={zh ? "状态" : "Status"}
            value={filters.status}
            onChange={(value) => onChange({ status: value })}
            options={STATUS_OPTIONS.map((item) => ({ value: item.value, label: zh ? item.zh : item.en }))}
          />
          <FilterSelect
            label={zh ? "语言" : "Language"}
            value={filters.language}
            onChange={(value) => onChange({ language: value })}
            options={LANGUAGE_OPTIONS.map((item) => ({ value: item.value, label: zh ? item.zh : item.en }))}
          />
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            <Trash2 className="h-4 w-4" />
            {zh ? "清除" : "Clear"}
          </button>
        </div>

        <Link
          href={adminPortalRoutes.knowledgeNew}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-medium text-white hover:bg-violet-700 lg:w-auto"
        >
          <Plus className="h-4 w-4" />
          {zh ? "新建文章" : "New article"}
        </Link>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-600">
      <span className="shrink-0 text-zinc-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
