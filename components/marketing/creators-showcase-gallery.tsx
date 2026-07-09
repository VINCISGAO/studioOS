"use client";

import { useMemo, useState } from "react";
import { Play, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MarketingShowcaseVideoModal } from "@/components/marketing/showcase/marketing-showcase-video-modal";
import { ShowcaseCover } from "@/components/marketing/showcase/showcase-cover";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import type { Locale } from "@/lib/i18n";
import { labelPlatform, labelWorkCategory } from "@/lib/localized-options";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    search: "Search works, categories, platforms",
    empty: "No works match your search.",
    noWorks: "No showcase works yet.",
    all: "All",
    noCategory: "No works in this category yet.",
    play: "Play"
  },
  zh: {
    search: "搜索作品、品类、平台",
    empty: "没有匹配的作品。",
    noWorks: "暂无精选作品。",
    all: "全部",
    noCategory: "该分类暂无作品。",
    play: "播放"
  }
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function workSearchHaystack(work: MarketingShowcaseWorkDto, locale: Locale) {
  return [
    work.title,
    work.description,
    work.category,
    work.platform,
    work.format,
    ...(work.tags ?? []),
    labelWorkCategory(work.category, locale),
    labelPlatform(work.platform, locale)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterWorks(works: MarketingShowcaseWorkDto[], query: string, locale: Locale) {
  const normalized = normalizeSearch(query);
  if (!normalized) return works;

  const terms = normalized.split(/\s+/).filter(Boolean);
  return works.filter((work) => {
    const haystack = workSearchHaystack(work, locale);
    return terms.every((term) => haystack.includes(term));
  });
}

export function CreatorsShowcaseGallery({
  locale,
  works,
  categories,
  initialPlayId
}: {
  locale: Locale;
  works: MarketingShowcaseWorkDto[];
  categories: string[];
  initialPlayId?: string;
}) {
  const t = copy[locale];
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeWorkId, setActiveWorkId] = useState<string | null>(initialPlayId ?? null);

  const searched = useMemo(() => filterWorks(works, query, locale), [works, query, locale]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return searched;
    return searched.filter((work) => work.category === activeCategory);
  }, [activeCategory, searched]);

  const activeWork =
    filtered.find((work) => work.id === activeWorkId) ??
    works.find((work) => work.id === activeWorkId) ??
    null;

  const emptyMessage = normalizeSearch(query)
    ? t.empty
    : activeCategory === "all"
      ? t.noWorks
      : t.noCategory;

  return (
    <div className="space-y-6">
      <div className="relative max-w-2xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search}
          className="h-12 rounded-lg border bg-white pl-10 shadow-sm"
          aria-label={t.search}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryPill active={activeCategory === "all"} label={t.all} onClick={() => setActiveCategory("all")} />
        {categories.map((category) => (
          <CategoryPill
            key={category}
            active={activeCategory === category}
            label={labelWorkCategory(category, locale)}
            onClick={() => setActiveCategory(category)}
          />
        ))}
      </div>

      {!filtered.length ? (
        <div className="mt-10 rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-16 text-center text-zinc-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((work) => (
            <ShowcaseCard key={work.id} work={work} locale={locale} playLabel={t.play} onOpen={() => setActiveWorkId(work.id)} />
          ))}
        </div>
      )}

      {activeWork ? (
        <MarketingShowcaseVideoModal work={activeWork} locale={locale} onClose={() => setActiveWorkId(null)} />
      ) : null}
    </div>
  );
}

function CategoryPill({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active ? "bg-zinc-950 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
      )}
    >
      {label}
    </button>
  );
}

function ShowcaseCard({
  work,
  locale,
  playLabel,
  onOpen
}: {
  work: MarketingShowcaseWorkDto;
  locale: Locale;
  playLabel: string;
  onOpen: () => void;
}) {
  const meta = `${labelWorkCategory(work.category, locale)} · ${labelPlatform(work.platform, locale)}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-[24px] bg-white text-left shadow-none ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-zinc-900">
        <ShowcaseCover work={work} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          <Play className="h-3.5 w-3.5 fill-current" />
          {playLabel}
        </span>
      </div>
      <div className="p-4 text-left">
        <h3 className="line-clamp-1 text-sm font-semibold text-zinc-950">{work.title}</h3>
        <p className="mt-1 text-xs text-zinc-500">{meta}</p>
      </div>
    </button>
  );
}
