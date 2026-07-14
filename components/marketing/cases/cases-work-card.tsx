"use client";

import { ArrowUpRight, Play } from "lucide-react";
import { ShowcaseCover } from "@/components/marketing/showcase/showcase-cover";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import type { Locale } from "@/lib/i18n";
import { labelPlatform, labelWorkCategory } from "@/lib/localized-options";

export function CasesWorkCard({
  work,
  locale,
  onOpen
}: {
  work: MarketingShowcaseWorkDto;
  locale: Locale;
  onOpen: () => void;
}) {
  const categoryLabel = labelWorkCategory(work.category, locale);
  const meta = `${categoryLabel} · ${labelPlatform(work.platform, locale)}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white text-left shadow-[0_8px_30px_-24px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.22)]"
    >
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-zinc-900">
        <ShowcaseCover
          work={work}
          className="h-full w-full transition duration-500 group-hover:scale-[1.02]"
          imageClassName="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/45 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {categoryLabel}
        </span>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-violet-700 shadow-md backdrop-blur-sm transition group-hover:scale-105">
            <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-semibold leading-snug text-zinc-950">{work.title}</h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-zinc-500">{meta}</p>
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition group-hover:bg-violet-100 group-hover:text-violet-700">
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
      </div>
    </button>
  );
}
