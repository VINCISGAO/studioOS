"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { ChapterLabel, RevealSection, cinematicEase } from "@/components/marketing/cinematic/motion-primitives";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { resolveWorkThumbnail } from "@/lib/media-url";
import type { CreatorWork } from "@/lib/types";

export function CinematicPosterWall({
  locale,
  works
}: {
  locale: Locale;
  works: CreatorWork[];
}) {
  const t = cinematicText("wall", locale);
  const posters = works.length > 0 ? works : fallbackPosters();
  const loop = [...posters, ...posters];

  return (
    <section className="overflow-hidden bg-[#080808] py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <RevealSection className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <ChapterLabel>{t.chapter}</ChapterLabel>
            <motion.h2
              variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: cinematicEase } } }}
              className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              {t.title}
            </motion.h2>
          </div>
          <Link href={withLocale("/creators", locale)} className="text-sm text-violet-300 transition hover:text-violet-200">
            {t.viewAll} →
          </Link>
        </RevealSection>
      </div>

      <div className="cinematic-poster-mask relative mt-14">
        <div className="animate-cinematic-marquee flex w-max gap-5 px-5 sm:gap-6 sm:px-8">
          {loop.map((work, index) => {
            const creator = creators.find((item) => item.id === work.creator_id);
            const href = creator
              ? withLocale(`/creators/${creator.id}?work=${work.id}`, locale)
              : withLocale("/creators", locale);

            return (
              <Link
                key={`${work.id}-${index}`}
                href={href}
                className="group relative w-[220px] shrink-0 sm:w-[260px]"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-2xl transition duration-500 group-hover:-translate-y-2 group-hover:border-violet-500/40">
                  <WorkCoverImage
                    src={resolveWorkThumbnail(work.video_url, work.thumbnail_url)}
                    alt={work.title}
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-sm font-semibold text-white line-clamp-2">{work.title}</p>
                    <p className="mt-1 text-[11px] text-zinc-400">{creator?.name ?? "Studio"}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function fallbackPosters(): CreatorWork[] {
  const now = new Date().toISOString();
  return [
    {
      id: "fallback-1",
      creator_id: "creator_01",
      title: "Smartwatch lifestyle film",
      category: "product",
      platform: "youtube",
      format: "16:9",
      thumbnail_url: "",
      video_url: "",
      description: "",
      turnaround: "72h",
      tags: [],
      created_at: now
    },
    {
      id: "fallback-2",
      creator_id: "creator_02",
      title: "Sparkling drink education ads",
      category: "food",
      platform: "instagram",
      format: "1:1",
      thumbnail_url: "",
      video_url: "",
      description: "",
      turnaround: "72h",
      tags: [],
      created_at: now
    }
  ];
}
