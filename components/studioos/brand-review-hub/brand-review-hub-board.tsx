"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Info, Search } from "lucide-react";
import { BrandReviewHubContent } from "@/components/studioos/brand-review-hub/brand-review-hub-content";
import { BrandReviewHubFeatureCards } from "@/components/studioos/brand-review-hub/brand-review-hub-feature-cards";
import {
  brandReviewHubText,
  matchesReviewDateFilter,
  reviewFilterBucket,
  reviewHubFilterOrder,
  type DateFilter,
  type ReviewHubFilter
} from "@/components/studioos/brand-review-hub/brand-review-hub-copy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { Locale } from "@/lib/i18n";
import type { ReviewHubItem } from "@/lib/studioos/review-hub";
import { cn } from "@/lib/utils";

export function BrandReviewHubBoard({ locale, items }: { locale: Locale; items: ReviewHubItem[] }) {
  const t = brandReviewHubText(locale);
  const [filter, setFilter] = useState<ReviewHubFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [query, setQuery] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  const counts = useMemo(() => {
    const base: Record<ReviewHubFilter, number> = {
      all: items.length,
      pending: 0,
      revision: 0,
      approved: 0,
      archived: 0
    };
    for (const item of items) {
      const bucket = reviewFilterBucket(item);
      if (bucket) base[bucket] += 1;
    }
    return base;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all") {
        const bucket = reviewFilterBucket(item);
        if (bucket !== filter) return false;
      }
      if (!matchesReviewDateFilter(item.updatedAt, dateFilter)) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.brandName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        String(item.latestVersion ?? "").includes(q)
      );
    });
  }, [items, filter, dateFilter, query]);

  const dateOptions: { id: DateFilter; label: string }[] = [
    { id: "all", label: t.dateAll },
    { id: "7d", label: t.date7d },
    { id: "30d", label: t.date30d },
    { id: "90d", label: t.date90d }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[28px]">{t.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 sm:text-[15px]">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 self-start text-sm font-medium text-violet-700 transition hover:text-violet-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <Info className="h-4 w-4" />
          </span>
          {t.guide}
        </button>
      </header>

      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reviewHubFilterOrder.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                filter === id
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900"
              )}
            >
              {t.filters[id]}
              <span className={cn("ml-1.5 tabular-nums", filter === id ? "text-white/85" : "text-zinc-400")}>
                {counts[id]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative min-w-[140px]">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-white pl-9 pr-8 text-sm text-zinc-700 outline-none ring-violet-500/20 focus:border-violet-300 focus:ring-2"
            >
              {dateOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </label>
          <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none ring-violet-500/20 transition focus:border-violet-300 focus:ring-2"
            />
          </div>
        </div>
      </section>

      <BrandReviewHubContent locale={locale} items={items} filtered={filtered} showPublishCta />

      <BrandReviewHubFeatureCards locale={locale} />

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.guideTitle}</DialogTitle>
            <DialogDescription className="text-left leading-relaxed">{t.guideIntro}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
