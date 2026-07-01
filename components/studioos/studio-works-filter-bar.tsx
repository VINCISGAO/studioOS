"use client";

import { Search } from "lucide-react";
import {
  StudioProfileWorksToolbar,
  type WorkSortKey,
  type WorkViewMode
} from "@/components/creator/creator-profile-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { Locale } from "@/lib/i18n";
import { worksFilterAllValue } from "@/lib/studioos/creator-works-ui";

const copy = {
  zh: {
    search: "搜索作品名称 / 品牌 / 标签",
    allPlatforms: "所有平台",
    allTypes: "所有类型",
    allTags: "所有标签"
  },
  en: {
    search: "Search title / brand / tags",
    allPlatforms: "All platforms",
    allTypes: "All types",
    allTags: "All tags"
  }
} as const;

export function StudioWorksFilterBar({
  locale,
  query,
  platform,
  category,
  tag,
  platformOptions,
  categoryOptions,
  tagOptions,
  sortKey,
  viewMode,
  onQueryChange,
  onPlatformChange,
  onCategoryChange,
  onTagChange,
  onSortChange,
  onViewModeChange
}: {
  locale: Locale;
  query: string;
  platform: string;
  category: string;
  tag: string;
  platformOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  tagOptions: { value: string; label: string }[];
  sortKey: WorkSortKey;
  viewMode: WorkViewMode;
  onQueryChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onSortChange: (value: WorkSortKey) => void;
  onViewModeChange: (value: WorkViewMode) => void;
}) {
  const t = copy[locale];

  return (
    <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t.search}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300"
          />
        </label>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[420px]">
          <FilterSelect
            value={platform}
            placeholder={t.allPlatforms}
            options={platformOptions}
            onChange={onPlatformChange}
          />
          <FilterSelect
            value={category}
            placeholder={t.allTypes}
            options={categoryOptions}
            onChange={onCategoryChange}
          />
          <FilterSelect value={tag} placeholder={t.allTags} options={tagOptions} onChange={onTagChange} />
        </div>
      </div>

      <StudioProfileWorksToolbar
        locale={locale}
        sortKey={sortKey}
        viewMode={viewMode}
        onSortChange={onSortChange}
        onViewModeChange={onViewModeChange}
      />
    </div>
  );
}

function FilterSelect({
  value,
  placeholder,
  options,
  onChange
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-white text-sm shadow-none">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={worksFilterAllValue}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
