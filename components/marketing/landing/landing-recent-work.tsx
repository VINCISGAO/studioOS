"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { MarketingEyebrowPill } from "@/components/marketing/landing/landing-ui";
import { RevealSection, cinematicEase } from "@/components/marketing/landing/landing-motion";
import { landingText } from "@/lib/marketing/landing-copy";
import { creators } from "@/lib/data";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { isChineseLanguage, withLocale } from "@/lib/i18n";
import { labelPlatform, labelWorkCategory } from "@/lib/localized-options";
import { resolveWorkThumbnail } from "@/lib/media-url";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function WorkCard({
  work,
  locale,
  copyLocale = locale,
  featured = false
}: {
  work: CreatorWork;
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  featured?: boolean;
}) {
  const creator = creators.find((item) => item.id === work.creator_id);
  const href = creator
    ? withLocale(`/creators/${creator.id}?work=${work.id}`, copyLocale)
    : withLocale("/case-studies", copyLocale);
  const poster = resolveWorkThumbnail(work.video_url, work.thumbnail_url);
  const meta = `${labelWorkCategory(work.category, locale)} · ${labelPlatform(work.platform, locale)}`;
  const featuredLabel = landingText("work", copyLocale).featured;

  return (
    <Link href={href} className={cn("group block h-full", !featured && "rounded-2xl bg-white shadow-[0_14px_40px_-28px_rgba(0,0,0,0.35)]")}>
      <div
        className={cn(
          "relative overflow-hidden bg-zinc-900 transition duration-500",
          featured
            ? "h-[260px] rounded-2xl shadow-[0_18px_60px_-30px_rgba(0,0,0,0.45)] sm:h-[360px]"
            : "h-[118px] rounded-t-2xl sm:h-[112px]"
        )}
      >
        {poster ? (
          <WorkCoverImage
            src={poster}
            alt={work.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">
            {work.title}
          </div>
        )}
        {featured ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 transition group-hover:opacity-100" />
            <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm">
              <span className="text-violet-300">✦</span>
              {featuredLabel}
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-white line-clamp-1">{work.title}</h3>
              <p className="mt-1 text-xs text-zinc-300">{meta}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-xs font-medium text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-950">
                  <Play className="ml-0.5 h-3 w-3 fill-zinc-950" />
                </span>
                {isChineseLanguage(copyLocale) ? "观看案例视频" : "Watch case video"}
              </span>
            </div>
          </>
        ) : null}
      </div>
      {!featured ? (
        <div className="flex items-center justify-between gap-3 p-3">
          <span className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-950 line-clamp-1">{work.title}</h3>
            <p className="mt-1 text-xs text-zinc-500">{meta}</p>
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-zinc-950 transition group-hover:border-black/20 group-hover:bg-zinc-950 group-hover:text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      ) : null}
    </Link>
  );
}

export function LandingRecentWork({
  locale,
  copyLocale = locale,
  works
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  works: CreatorWork[];
  engagement?: Record<string, WorkEngagementSnapshot>;
  isLoggedIn?: boolean;
}) {
  const t = landingText("work", copyLocale);
  const [hero, ...rest] = works.slice(0, 5);
  const subtitle = isChineseLanguage(copyLocale)
    ? "来自全球品牌的真实项目，创意驱动结果。"
    : "Real projects from global brands, creative built to drive outcomes.";

  return (
    <section className="bg-[#f7f6f1] pb-11 pt-10 sm:pb-16 sm:pt-16">
      <div className="mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-0">
        <RevealSection className="mx-auto max-w-3xl text-center">
          <MarketingEyebrowPill tone="light">{t.eyebrow}</MarketingEyebrowPill>
          <h2 className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.045em] text-zinc-950 sm:text-[2.45rem]">{t.title}</h2>
          <p className="mt-4 text-sm text-zinc-500">{subtitle}</p>
        </RevealSection>

        {hero ? (
          <>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-9 sm:gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.1fr)]">
              <motion.div
                className="col-span-2 lg:col-span-1"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: cinematicEase }}
              >
                <WorkCard work={hero} locale={locale} copyLocale={copyLocale} featured />
              </motion.div>

              <div className="contents lg:grid lg:grid-cols-2 lg:gap-4">
                {rest.map((work, index) => (
                  <motion.div
                    key={work.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: cinematicEase, delay: index * 0.06 }}
                  >
                    <WorkCard work={work} locale={locale} copyLocale={copyLocale} />
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="mt-7 flex justify-center sm:mt-8">
              <Link
                href={withLocale("/case-studies", copyLocale)}
                className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-2 text-center text-sm font-semibold leading-snug text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)] transition hover:bg-zinc-800"
              >
                {t.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
