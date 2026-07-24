"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingEyebrowPill, MarketingSectionTitle } from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import { isChineseLanguage, type Locale, type MarketingLocale } from "@/lib/i18n";
import { asMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";
import { ShowcaseCover } from "@/components/marketing/showcase/showcase-cover";
import { MarketingShowcaseVideoModal } from "@/components/marketing/showcase/marketing-showcase-video-modal";
import { useState } from "react";

const FEATURED_WORK_IDS = [
  "curated_luxury_serum",
  "curated_perfume_ad",
  "curated_consumer_tech",
  "curated_video_demo"
] as const;

const PROJECT_CARD_PRESENTATION: Partial<
  Record<string, { titleZh: string; studioZh: string; titleEn?: string; studioEn?: string }>
> = {
  curated_video_demo: { titleZh: "智能手表产品视频", studioZh: "Pulse Studio", titleEn: "Smartwatch product video" },
  curated_perfume_ad: { titleZh: "香水品牌广告片", studioZh: "Aroma Studio" },
  curated_consumer_tech: { titleZh: "汽车品牌 TVC", studioZh: "Drive Future" },
  curated_luxury_serum: { titleZh: "奢侈品精华上市影片", studioZh: "Serum Studio" }
};

function selectFeaturedWorks(works: MarketingShowcaseWorkDto[]) {
  const byId = new Map(works.map((work) => [work.id, work]));
  const ordered = FEATURED_WORK_IDS.map((id) => byId.get(id)).filter(
    (work): work is MarketingShowcaseWorkDto => Boolean(work)
  );
  if (ordered.length >= 4) return ordered.slice(0, 4);

  const pickedIds = new Set(ordered.map((work) => work.id));
  return [...ordered, ...works.filter((work) => !pickedIds.has(work.id))].slice(0, 4);
}

function WorkCard({
  work,
  locale,
  copyLocale = locale,
  cardIndex,
  onOpen
}: {
  work: MarketingShowcaseWorkDto;
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  cardIndex: number;
  onOpen: () => void;
}) {
  const zh = isChineseLanguage(copyLocale);
  const presentation = PROJECT_CARD_PRESENTATION[work.id];
  const title = zh
    ? presentation?.titleZh ?? work.title
    : presentation?.titleEn ?? work.title;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={title}
      className="group flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-black/10 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-md lg:rounded-2xl lg:shadow-[0_14px_40px_-32px_rgba(0,0,0,0.28)]"
    >
      <div className="relative h-[112px] w-full overflow-hidden bg-zinc-900 sm:h-auto sm:aspect-[16/8] lg:aspect-[4/3]">
        <ShowcaseCover
          work={work}
          priority={cardIndex === 0}
          className="absolute inset-0"
          imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 to-transparent lg:from-black/75 lg:via-black/15 lg:to-black/5" />
      </div>

      <div className="flex items-center justify-between gap-2 p-2.5 sm:gap-3 sm:p-3 lg:px-4 lg:py-3.5">
        <h3 className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-950 sm:text-sm lg:text-base">
          {title}
        </h3>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition group-hover:bg-zinc-800 sm:h-7 sm:w-7 lg:h-9 lg:w-9">
          <ArrowRight className="h-3 w-3 lg:h-4 lg:w-4" />
        </span>
      </div>
    </button>
  );
}

export function LandingRecentWork({
  locale,
  copyLocale = locale,
  works
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  works: MarketingShowcaseWorkDto[];
}) {
  const t = landingText("work", copyLocale);
  const [activeWork, setActiveWork] = useState<MarketingShowcaseWorkDto | null>(null);
  const featuredWorks = selectFeaturedWorks(works);

  return (
    <section id="work" className="bg-[#FFFFFF] pb-8 pt-6 sm:pb-16 sm:pt-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <MarketingEyebrowPill tone="light">{t.eyebrow}</MarketingEyebrowPill>
          <MarketingSectionTitle
            tone="light"
            className="mt-1.5 text-[1.45rem] leading-tight sm:mt-2 sm:text-[2.45rem]"
          >
            {t.title}
          </MarketingSectionTitle>
          <p className="mt-2 px-1 text-xs leading-5 text-zinc-500 sm:mt-4 sm:text-sm sm:leading-6">{t.subtitle}</p>
        </div>

        {featuredWorks.length > 0 ? (
          <>
            <div className="mt-4 grid w-full grid-cols-2 gap-3 sm:mt-9 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4 xl:gap-5">
              {featuredWorks.map((work, index) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  locale={locale}
                  copyLocale={copyLocale}
                  cardIndex={index}
                  onOpen={() => setActiveWork(work)}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-center px-1 sm:mt-8">
              <Link
                href={marketingHomeHref.works(copyLocale)}
                className="inline-flex min-h-10 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-2 text-center text-[13px] font-semibold leading-snug text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)] transition hover:bg-zinc-800 sm:min-h-11 sm:w-auto sm:max-w-sm sm:px-6 sm:py-2 sm:text-sm"
              >
                {t.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : null}
      </div>

      {activeWork ? (
        <MarketingShowcaseVideoModal
          work={activeWork}
          locale={asMarketingLocale(copyLocale)}
          onClose={() => setActiveWork(null)}
        />
      ) : null}
    </section>
  );
}
