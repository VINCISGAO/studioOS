"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CreatorPortfolioWorksGrid } from "@/components/creator/creator-profile-ui";
import { Input } from "@/components/ui/input";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import {
  labelPlatform,
  labelVideoFormat,
  labelWorkCategory
} from "@/lib/localized-options";
import { canEmbedVideo, sanitizeVideoUrl } from "@/lib/media-url";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";

const copy = {
  en: {
    search: "Search works, styles, categories",
    empty: "No works match your search.",
    noWorks: "No works yet."
  },
  zh: {
    search: "搜索作品、风格、品类",
    empty: "没有匹配的作品。",
    noWorks: "暂无作品。"
  }
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function workSearchHaystack(work: CreatorWork, locale: Locale) {
  const creator = creators.find((item) => item.id === work.creator_id);
  return [
    work.title,
    work.description,
    work.category,
    work.platform,
    work.format,
    work.turnaround,
    ...(work.tags ?? []),
    creator?.name,
    creator?.headline,
    labelWorkCategory(work.category, locale),
    labelPlatform(work.platform, locale),
    labelVideoFormat(work.format, locale)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterWorks(works: CreatorWork[], query: string, locale: Locale) {
  const normalized = normalizeSearch(query);
  if (!normalized) {
    return works;
  }

  const terms = normalized.split(/\s+/).filter(Boolean);
  return works.filter((work) => {
    const haystack = workSearchHaystack(work, locale);
    return terms.every((term) => haystack.includes(term));
  });
}

export function CreatorsWorksShowcase({
  locale,
  works,
  engagement,
  isLoggedIn
}: {
  locale: Locale;
  works: CreatorWork[];
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn: boolean;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const filteredWorks = useMemo(() => filterWorks(works, query, locale), [works, query, locale]);

  const creatorByWorkId = Object.fromEntries(
    filteredWorks
      .map((work) => {
        const creator = creators.find((item) => item.id === work.creator_id);
        if (!creator) {
          return null;
        }
        return [
          work.id,
          {
            name: creator.name,
            href: withLocale(`/creators/${creator.id}`, locale)
          }
        ] as const;
      })
      .filter(Boolean) as [string, { name: string; href: string }][]
  );

  function handleActivate(work: CreatorWork) {
    const creator = creators.find((item) => item.id === work.creator_id);
    if (!creator) {
      return;
    }

    if (canEmbedVideo(sanitizeVideoUrl(work.video_url))) {
      setActiveWorkId(work.id);
      return;
    }

    router.push(withLocale(`/creators/${creator.id}?work=${work.id}`, locale));
  }

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

      <CreatorPortfolioWorksGrid
        locale={locale}
        works={filteredWorks}
        activeWorkId={activeWorkId}
        engagement={engagement}
        isLoggedIn={isLoggedIn}
        empty={normalizeSearch(query) ? t.empty : t.noWorks}
        onActivate={handleActivate}
        creatorByWorkId={creatorByWorkId}
        columns={4}
      />
    </div>
  );
}
