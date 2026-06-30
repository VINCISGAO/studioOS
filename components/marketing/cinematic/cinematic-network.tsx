"use client";

import Link from "next/link";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { ChapterLabel } from "@/components/marketing/cinematic/motion-primitives";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import { creators, creatorWorks } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { resolveWorkThumbnail } from "@/lib/media-url";

type RosterCard = {
  id: string;
  studio: string;
  city: string;
  timezone: string;
  role: { en: string; zh: string };
  tags: { en: string[]; zh: string[] };
  status: "active" | "open";
  workId?: string;
};

const ROSTER: RosterCard[] = [
  {
    id: "creator_01",
    studio: "Nova Motion Studio",
    city: "Seoul",
    timezone: "GMT+9",
    role: { en: "AI product film", zh: "AI 产品短片" },
    tags: { en: ["Beauty", "4K", "72h"], zh: ["美妆", "4K", "72h"] },
    status: "active",
    workId: "work_1001"
  },
  {
    id: "creator_02",
    studio: "Signal Frame Lab",
    city: "Barcelona",
    timezone: "GMT+1",
    role: { en: "Performance demos", zh: "效果向产品片" },
    tags: { en: ["CPG", "YouTube"], zh: ["快消", "YouTube"] },
    status: "open",
    workId: "work_1003"
  },
  {
    id: "creator_03",
    studio: "Atlas UGC Systems",
    city: "Austin",
    timezone: "GMT-5",
    role: { en: "UGC systems", zh: "UGC 批量化" },
    tags: { en: ["DTC", "Meta"], zh: ["DTC", "Meta"] },
    status: "open",
    workId: "work_1004"
  }
];

function workThumb(workId?: string) {
  if (!workId) return null;
  const work = creatorWorks.find((item) => item.id === workId);
  if (!work) return null;
  return resolveWorkThumbnail(work.video_url, work.thumbnail_url);
}

export function CinematicNetwork({ locale }: { locale: Locale }) {
  const t = cinematicText("network", locale);

  return (
    <section className="bg-[#070707] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-xl">
          <ChapterLabel>{t.chapter}</ChapterLabel>
          <p className="mt-6 text-xl text-zinc-500 sm:text-2xl">{t.title}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">{t.highlight}</h2>
          <p className="mt-5 text-base leading-7 text-zinc-400">{t.subtitle}</p>
          <p className="mt-6 inline-flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t.matchNote}
          </p>
        </div>

        <div className="mt-12 flex items-end justify-between gap-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">{t.rosterEyebrow}</p>
          <Link href={withLocale("/creators", locale)} className="text-xs text-zinc-400 hover:text-white">
            {locale === "zh" ? "查看全部 →" : "View all →"}
          </Link>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROSTER.map((card) => {
            const thumb = workThumb(card.workId);
            const creator = creators.find((item) => item.id === card.id);
            const statusLabel = card.status === "active" ? t.statusActive : t.statusOpen;

            return (
              <li
                key={card.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]"
              >
                <div className="relative aspect-[16/8] bg-zinc-900">
                  {thumb ? (
                    <WorkCoverImage src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] text-zinc-200">{statusLabel}</span>
                    <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] text-zinc-400">{card.timezone}</span>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white">{card.studio}</h3>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {card.role[locale]} · {card.city}
                      </p>
                    </div>
                    {creator ? (
                      <span className="text-xs text-zinc-400">★ {creator.rating.toFixed(1)}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {card.tags[locale].map((tag) => (
                      <span key={tag} className="rounded-md border border-white/8 px-2 py-0.5 text-[11px] text-zinc-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
