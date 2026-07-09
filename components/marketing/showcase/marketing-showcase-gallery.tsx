"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { MarketingShowcaseVideoModal } from "@/components/marketing/showcase/marketing-showcase-video-modal";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import type { Locale } from "@/lib/i18n";
import { labelPlatform, labelWorkCategory } from "@/lib/localized-options";
import { ShowcaseCover } from "@/components/marketing/showcase/showcase-cover";
import { cn } from "@/lib/utils";

export function MarketingShowcaseGallery({
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
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeWorkId, setActiveWorkId] = useState<string | null>(initialPlayId ?? null);
  const isZh = locale === "zh";

  const filtered = useMemo(() => {
    if (activeCategory === "all") return works;
    return works.filter((work) => work.category === activeCategory);
  }, [activeCategory, works]);

  const activeWork = filtered.find((work) => work.id === activeWorkId) ?? works.find((work) => work.id === activeWorkId) ?? null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <CategoryPill
          active={activeCategory === "all"}
          label={isZh ? "全部" : "All"}
          onClick={() => setActiveCategory("all")}
        />
        {categories.map((category) => (
          <CategoryPill
            key={category}
            active={activeCategory === category}
            label={labelWorkCategory(category, locale)}
            onClick={() => setActiveCategory(category)}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((work) => (
          <ShowcaseCard key={work.id} work={work} locale={locale} onOpen={() => setActiveWorkId(work.id)} />
        ))}
      </div>

      {!filtered.length ? (
        <p className="mt-10 text-center text-sm text-zinc-500">
          {isZh ? "该分类暂无作品。" : "No works in this category yet."}
        </p>
      ) : null}

      {activeWork ? (
        <MarketingShowcaseVideoModal work={activeWork} locale={locale} onClose={() => setActiveWorkId(null)} />
      ) : null}
    </>
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
  onOpen
}: {
  work: MarketingShowcaseWorkDto;
  locale: Locale;
  onOpen: () => void;
}) {
  const meta = `${labelWorkCategory(work.category, locale)} · ${labelPlatform(work.platform, locale)}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl bg-white text-left shadow-[0_14px_40px_-28px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5"
    >
      <div className="relative h-44 overflow-hidden bg-zinc-900 sm:h-48">
        <ShowcaseCover
          work={work}
          className="transition duration-700 group-hover:scale-[1.03]"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          <Play className="h-3.5 w-3.5 fill-current" />
          {locale === "zh" ? "播放" : "Play"}
        </span>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-zinc-950">{work.title}</h3>
        <p className="mt-1 text-xs text-zinc-500">{meta}</p>
      </div>
    </button>
  );
}
