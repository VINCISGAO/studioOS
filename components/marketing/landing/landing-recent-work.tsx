"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { RevealSection, cinematicEase } from "@/components/marketing/landing/landing-motion";
import { landingText } from "@/lib/marketing/landing-copy";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { labelPlatform, labelWorkCategory } from "@/lib/localized-options";
import { resolveWorkThumbnail } from "@/lib/media-url";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function WorkCard({
  work,
  locale,
  featured = false
}: {
  work: CreatorWork;
  locale: Locale;
  featured?: boolean;
}) {
  const creator = creators.find((item) => item.id === work.creator_id);
  const href = creator
    ? withLocale(`/creators/${creator.id}?work=${work.id}`, locale)
    : withLocale("/case-studies", locale);
  const poster = resolveWorkThumbnail(work.video_url, work.thumbnail_url);
  const meta = `${labelWorkCategory(work.category, locale)} · ${labelPlatform(work.platform, locale)}`;

  return (
    <Link href={href} className="group block h-full">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-black/10 bg-zinc-900 transition duration-500 group-hover:border-black/30 group-hover:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]",
          featured ? "aspect-[16/11] sm:aspect-auto sm:min-h-[320px]" : "aspect-[16/10]"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition group-hover:opacity-100" />
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white opacity-0 backdrop-blur transition duration-300 group-hover:scale-105 group-hover:opacity-100">
          <Play className="ml-0.5 h-6 w-6 fill-white" />
        </span>
        {featured ? (
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-violet-300">
              {locale === "zh" ? "精选案例" : "Featured"}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">{work.title}</h3>
            <p className="mt-1 text-xs text-zinc-400">{meta}</p>
          </div>
        ) : null}
      </div>
      {!featured ? (
        <>
          <h3 className="mt-3 text-sm font-semibold text-zinc-950 line-clamp-1">{work.title}</h3>
          <p className="mt-1 text-xs text-zinc-500">{meta}</p>
        </>
      ) : null}
    </Link>
  );
}

export function LandingRecentWork({
  locale,
  works
}: {
  locale: Locale;
  works: CreatorWork[];
  engagement?: Record<string, WorkEngagementSnapshot>;
  isLoggedIn?: boolean;
}) {
  const t = landingText("work", locale);
  const [hero, ...rest] = works.slice(0, 5);

  return (
    <section className="border-t border-black/10 bg-[#f6f5f1] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RevealSection className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">{t.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{t.title}</h2>
          </div>
          <Link
            href={withLocale("/case-studies", locale)}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-950"
          >
            {t.viewAll}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </RevealSection>

        {hero ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: cinematicEase }}
            >
              <WorkCard work={hero} locale={locale} featured />
            </motion.div>

            <div className="grid grid-cols-2 gap-5">
              {rest.map((work, index) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: cinematicEase, delay: index * 0.06 }}
                >
                  <WorkCard work={work} locale={locale} />
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
