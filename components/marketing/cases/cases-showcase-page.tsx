"use client";

import { useMemo, useState } from "react";
import {
  Car,
  ChevronDown,
  Cpu,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { CasesHeroIllustration } from "@/components/marketing/cases/cases-hero-illustration";
import { CasesWorkCard } from "@/components/marketing/cases/cases-work-card";
import { MarketingShowcaseVideoModal } from "@/components/marketing/showcase/marketing-showcase-video-modal";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import {
  CASES_PRIMARY_CATEGORIES,
  type CasesPageCopy
} from "@/lib/marketing/cases-copy";
import type { MarketingLocale } from "@/lib/i18n";
import { toLegacyLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";
import { labelWorkCategory } from "@/lib/localized-options";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, typeof Car> = {
  Automotive: Car,
  Beauty: Sparkles,
  "Consumer tech": Cpu
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function workSearchHaystack(work: MarketingShowcaseWorkDto, locale: MarketingLocale) {
  const legacyLocale = toLegacyLocale(locale);
  return [
    work.title,
    work.description,
    work.category,
    work.platform,
    work.format,
    ...(work.tags ?? []),
    labelWorkCategory(work.category, legacyLocale)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterWorks(works: MarketingShowcaseWorkDto[], query: string, locale: MarketingLocale) {
  const normalized = normalizeSearch(query);
  if (!normalized) return works;
  const terms = normalized.split(/\s+/).filter(Boolean);
  return works.filter((work) => {
    const haystack = workSearchHaystack(work, locale);
    return terms.every((term) => haystack.includes(term));
  });
}

function sortWorks(works: MarketingShowcaseWorkDto[]) {
  return [...works].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

function CategoryPill({
  active,
  label,
  icon: Icon,
  onClick
}: {
  active: boolean;
  label: string;
  icon?: typeof LayoutGrid;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
        active
          ? "bg-violet-600 text-white shadow-[0_10px_24px_-16px_rgba(109,40,217,0.85)]"
          : "border border-zinc-200/80 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} /> : null}
      {label}
    </button>
  );
}

export function CasesShowcasePage({
  locale,
  copy,
  works,
  categories,
  initialPlayId
}: {
  locale: MarketingLocale;
  copy: CasesPageCopy;
  works: MarketingShowcaseWorkDto[];
  categories: string[];
  initialPlayId?: string;
}) {
  const legacyLocale = toLegacyLocale(locale);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(initialPlayId ?? null);

  const primarySet = useMemo(() => new Set<string>(CASES_PRIMARY_CATEGORIES), []);
  const primaryCategories = categories.filter((category) => primarySet.has(category));
  const extraCategories = categories.filter((category) => !primarySet.has(category));

  const filtered = useMemo(() => {
    const searched = filterWorks(works, query, locale);
    const scoped =
      activeCategory === "all" ? searched : searched.filter((work) => work.category === activeCategory);
    return sortWorks(scoped);
  }, [activeCategory, locale, query, works]);

  const activeWork =
    filtered.find((work) => work.id === activeWorkId) ??
    works.find((work) => work.id === activeWorkId) ??
    null;

  const emptyMessage = normalizeSearch(query)
    ? copy.empty
    : activeCategory === "all"
      ? copy.noWorks
      : copy.noCategory;

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-[1.75rem] border border-violet-100/70 bg-white shadow-[0_18px_60px_-48px_rgba(76,29,149,0.35)]">
        <div className="grid items-end gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8 lg:p-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-0.5 shrink-0 rounded-full bg-violet-600" aria-hidden />
              <p className="text-sm font-semibold text-violet-700">{copy.eyebrow}</p>
            </div>
            <h1 className="mt-4 max-w-3xl text-[clamp(1.85rem,1.5rem+1.4vw,2.65rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
              {copy.titleLead}
              <span className="text-violet-600">{copy.titleAccent}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-[15px]">{copy.subtitle}</p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  aria-label={copy.searchPlaceholder}
                  className="h-12 w-full rounded-full border border-zinc-200 bg-zinc-50/80 pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
                />
              </label>
              <div className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-4 text-sm font-medium text-zinc-700">
                <SlidersHorizontal className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
                <span>{copy.sortLatest}</span>
                <ChevronDown className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
              </div>
            </div>
          </div>
          <CasesHeroIllustration />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2.5">
        <CategoryPill
          active={activeCategory === "all"}
          label={copy.all}
          icon={LayoutGrid}
          onClick={() => {
            setActiveCategory("all");
            setMoreOpen(false);
          }}
        />
        {primaryCategories.map((category) => {
          const Icon = CATEGORY_ICONS[category] ?? LayoutGrid;
          return (
            <CategoryPill
              key={category}
              active={activeCategory === category}
              label={labelWorkCategory(category, legacyLocale)}
              icon={Icon}
              onClick={() => {
                setActiveCategory(category);
                setMoreOpen(false);
              }}
            />
          );
        })}
        {extraCategories.length ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
                extraCategories.includes(activeCategory)
                  ? "bg-violet-600 text-white shadow-[0_10px_24px_-16px_rgba(109,40,217,0.85)]"
                  : "border border-zinc-200/80 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {copy.more}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} />
            </button>
            {moreOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label={copy.more}
                  onClick={() => setMoreOpen(false)}
                />
                <div className="absolute left-0 z-20 mt-2 min-w-[12rem] rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                  {extraCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category);
                        setMoreOpen(false);
                      }}
                      className={cn(
                        "block w-full rounded-lg px-3 py-2 text-left text-sm transition",
                        activeCategory === category
                          ? "bg-violet-50 font-medium text-violet-700"
                          : "text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      {labelWorkCategory(category, legacyLocale)}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {!filtered.length ? (
        <div className="rounded-[24px] border border-dashed border-zinc-200 bg-white/70 px-6 py-16 text-center text-zinc-500">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((work) => (
              <CasesWorkCard
                key={work.id}
                work={work}
                locale={locale}
                onOpen={() => setActiveWorkId(work.id)}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 pt-2">
            <span className="h-px flex-1 bg-zinc-200" />
            <p className="shrink-0 text-sm text-zinc-400">{copy.endOfList}</p>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>
        </>
      )}

      {activeWork ? (
        <MarketingShowcaseVideoModal work={activeWork} locale={locale} onClose={() => setActiveWorkId(null)} />
      ) : null}
    </div>
  );
}
