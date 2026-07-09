"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { MarketingEyebrowPill, MarketingSectionTitle } from "@/components/marketing/landing/landing-ui";
import { landingText } from "@/lib/marketing/landing-copy";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
import { isChineseLanguage, type Locale, type MarketingLocale } from "@/lib/i18n";
import { labelPlatform, labelWorkCategory } from "@/lib/localized-options";
import { ShowcaseCover } from "@/components/marketing/showcase/showcase-cover";
import { MarketingShowcaseVideoModal } from "@/components/marketing/showcase/marketing-showcase-video-modal";
import { useState } from "react";
import { cn } from "@/lib/utils";

function ShowcasePoster({
  work,
  className,
  priority = false
}: {
  work: MarketingShowcaseWorkDto;
  className?: string;
  priority?: boolean;
}) {
  return <ShowcaseCover work={work} className={className} priority={priority} />;
}

function WorkCard({
  work,
  locale,
  copyLocale = locale,
  featured = false,
  onOpen
}: {
  work: MarketingShowcaseWorkDto;
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  featured?: boolean;
  onOpen: () => void;
}) {
  const meta = `${labelWorkCategory(work.category, locale)} · ${labelPlatform(work.platform, locale)}`;
  const featuredLabel = landingText("work", copyLocale).featured;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group block h-full w-full cursor-pointer text-left",
        !featured && "rounded-2xl bg-white shadow-[0_14px_40px_-28px_rgba(0,0,0,0.35)]"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-zinc-900",
          featured
            ? "h-[260px] rounded-2xl shadow-[0_18px_60px_-30px_rgba(0,0,0,0.45)] sm:h-[360px]"
            : "h-[118px] rounded-t-2xl sm:h-[112px]"
        )}
      >
        <ShowcasePoster
          work={work}
          priority={featured}
          className="transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md sm:bottom-4 sm:right-4">
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        </span>
        {featured ? (
          <>
            <span className="pointer-events-none absolute left-5 top-5 z-[1] inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm">
              <span className="text-violet-300">✦</span>
              {featuredLabel}
            </span>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex items-end justify-between gap-4 p-5 sm:p-6">
              <span className="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-950">
                  <Play className="ml-0.5 h-3 w-3 fill-zinc-950" />
                </span>
                {isChineseLanguage(copyLocale) ? "观看案例视频" : "Watch case video"}
              </span>
              <span className="min-w-0 text-right">
                <p className="text-xs text-zinc-300 sm:text-sm">{meta}</p>
              </span>
            </div>
          </>
        ) : null}
      </div>

      {!featured ? (
        <div className="flex items-center justify-between gap-3 p-3">
          <span className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold text-zinc-950">{work.title}</h3>
            <p className="mt-1 text-xs text-zinc-500">{meta}</p>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-zinc-950 transition group-hover:border-black/20 group-hover:bg-zinc-950 group-hover:text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      ) : null}
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
  const [hero, ...rest] = works.slice(0, 5);
  const modalLocale = isChineseLanguage(copyLocale) ? "zh" : "en";
  const subtitle = isChineseLanguage(copyLocale)
    ? "来自全球品牌的真实项目，创意驱动结果。"
    : "Real projects from global brands, creative built to drive outcomes.";

  return (
    <section className="bg-[#f7f6f1] pb-11 pt-10 sm:pb-16 sm:pt-16">
      <div className="mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-0">
        <div className="mx-auto max-w-3xl text-center">
          <MarketingEyebrowPill tone="light">{t.eyebrow}</MarketingEyebrowPill>
          <MarketingSectionTitle tone="light" className="mt-2">
            {t.title}
          </MarketingSectionTitle>
          <p className="mt-4 text-sm text-zinc-500">{subtitle}</p>
        </div>

        {hero ? (
          <>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.1fr)]">
              <div className="col-span-2 lg:col-span-1">
                <WorkCard
                  work={hero}
                  locale={locale}
                  copyLocale={copyLocale}
                  featured
                  onOpen={() => setActiveWork(hero)}
                />
              </div>

              <div className="contents lg:grid lg:grid-cols-2 lg:gap-4">
                {rest.map((work) => (
                  <div key={work.id}>
                    <WorkCard
                      work={work}
                      locale={locale}
                      copyLocale={copyLocale}
                      onOpen={() => setActiveWork(work)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-7 flex justify-center sm:mt-8">
              <Link
                href={marketingHomeHref.works(copyLocale)}
                className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-2 text-center text-sm font-semibold leading-snug text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)] transition hover:bg-zinc-800"
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
          locale={modalLocale}
          onClose={() => setActiveWork(null)}
        />
      ) : null}
    </section>
  );
}
