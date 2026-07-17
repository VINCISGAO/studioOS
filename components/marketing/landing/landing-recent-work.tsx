"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingEyebrowPill, MarketingSectionTitle } from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import { isChineseLanguage, type Locale, type MarketingLocale } from "@/lib/i18n";
import { asMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";
import { labelWorkCategory } from "@/lib/localized-options";
import { ShowcaseCover } from "@/components/marketing/showcase/showcase-cover";
import { MarketingShowcaseVideoModal } from "@/components/marketing/showcase/marketing-showcase-video-modal";
import { useState } from "react";

const FEATURED_WORK_IDS = [
  "curated_luxury_serum",
  "curated_perfume_ad",
  "curated_consumer_tech",
  "curated_video_demo"
] as const;

const PROJECT_CARD_STATUS = [
  { zh: "进行中", en: "In progress" },
  { zh: "进行中", en: "In progress" },
  { zh: "已交付", en: "Delivered" },
  { zh: "匹配中", en: "Matching" }
] as const;

const PROJECT_CARD_FOOTER = [
  { zh: "预算 $9,200 · 截止 5 天后", en: "Budget $9,200 · Due in 5 days" },
  { zh: "预算 $8,000 · 截止 2 天后", en: "Budget $8,000 · Due in 2 days" },
  { zh: "预算 $15,000 · 已交付", en: "Budget $15,000 · Delivered" },
  { zh: "预算 $6,500 · 匹配中", en: "Budget $6,500 · Matching" }
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
  const status = PROJECT_CARD_STATUS[cardIndex] ?? PROJECT_CARD_STATUS[0];
  const footer = PROJECT_CARD_FOOTER[cardIndex] ?? PROJECT_CARD_FOOTER[0];
  const title = zh
    ? presentation?.titleZh ?? work.title
    : presentation?.titleEn ?? work.title;
  const studio = zh
    ? presentation?.studioZh ?? work.tags[0] ?? labelWorkCategory(work.category, locale)
    : presentation?.studioEn ?? work.tags[0] ?? labelWorkCategory(work.category, locale);
  const footerMeta = zh ? footer.zh : footer.en;

  return (
    <button
      type="button"
      onClick={onOpen}
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
        <span className="pointer-events-none absolute left-2 top-2 z-[1] rounded-full bg-white px-1.5 py-0.5 text-[9px] font-medium text-zinc-950 shadow-sm sm:px-2 sm:py-1 sm:text-[10px] lg:left-4 lg:top-4 lg:px-3 lg:text-xs">
          {zh ? status.zh : status.en}
        </span>
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[1] hidden lg:block">
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-white">{title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-white/75">{studio}</p>
        </div>
      </div>

      <div className="space-y-1.5 p-2.5 sm:space-y-2 sm:p-3 lg:hidden">
        <h3 className="truncate text-xs font-semibold text-zinc-950 sm:text-sm">{title}</h3>
        <p className="truncate text-[10px] text-zinc-500 sm:text-xs">{studio}</p>
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <p className="min-w-0 flex-1 text-[10px] leading-3.5 text-zinc-600 sm:text-[11px] sm:leading-4">{footerMeta}</p>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white">
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="hidden min-h-[4.25rem] items-center justify-between gap-3 px-4 py-3.5 lg:flex">
        <p className="min-w-0 flex-1 text-sm leading-6 text-zinc-600">{footerMeta}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition group-hover:bg-zinc-800">
          <ArrowRight className="h-4 w-4" />
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
  const subtitle = isChineseLanguage(copyLocale)
    ? "来自全球品牌的真实商业项目，按预算与品类精选展示。"
    : "Real commercial projects from global brands, curated by budget and category.";

  return (
    <section className="bg-[#FFFFFF] pb-8 pt-6 sm:pb-16 sm:pt-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <MarketingEyebrowPill tone="light">{t.eyebrow}</MarketingEyebrowPill>
          <MarketingSectionTitle
            tone="light"
            className="mt-1.5 text-[1.45rem] leading-tight sm:mt-2 sm:text-[2.45rem]"
          >
            {t.title}
          </MarketingSectionTitle>
          <p className="mt-2 px-1 text-xs leading-5 text-zinc-500 sm:mt-4 sm:text-sm sm:leading-6">{subtitle}</p>
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
