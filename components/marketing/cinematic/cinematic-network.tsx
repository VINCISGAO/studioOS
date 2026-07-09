"use client";

import Link from "next/link";
import { WorkCoverImage } from "@/components/creator/work-cover-image";
import { MarketingEyebrowPill } from "@/components/marketing/landing/landing-ui";
import { cinematicText } from "@/lib/marketing/cinematic-copy";
import { creators, creatorWorks } from "@/lib/data";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { resolveWorkThumbnail } from "@/lib/media-url";
import { cn } from "@/lib/utils";

type RosterCard = {
  id: string;
  studio: string;
  city: string;
  timezone: string;
  role: Record<MarketingLocale, string>;
  tags: Record<MarketingLocale, string[]>;
  status: "active" | "open";
  workId?: string;
};

const ROSTER: RosterCard[] = [
  {
    id: "creator_01",
    studio: "Nova Motion Studio",
    city: "Seoul",
    timezone: "GMT+9",
    role: {
      en: "AI product film",
      "zh-CN": "AI 产品短片",
      "zh-TW": "AI 產品短片",
      ja: "AI 商品映像",
      ko: "AI 제품 영상",
      ms: "Filem produk AI",
      km: "វីដេអូផលិតផល AI",
      th: "ฟิล์มสินค้า AI",
      vi: "Phim sản phẩm AI",
      fr: "Film produit IA",
      es: "Vídeo de producto con IA"
    },
    tags: {
      en: ["Beauty", "4K", "72h"],
      "zh-CN": ["美妆", "4K", "72h"],
      "zh-TW": ["美妝", "4K", "72h"],
      ja: ["ビューティー", "4K", "72h"],
      ko: ["뷰티", "4K", "72h"],
      ms: ["Kecantikan", "4K", "72j"],
      km: ["សម្រស់", "4K", "72ម៉ោង"],
      th: ["บิวตี้", "4K", "72ชม."],
      vi: ["Làm đẹp", "4K", "72h"],
      fr: ["Beauté", "4K", "72h"],
      es: ["Belleza", "4K", "72h"]
    },
    status: "active",
    workId: "work_1001"
  },
  {
    id: "creator_02",
    studio: "Signal Frame Lab",
    city: "Barcelona",
    timezone: "GMT+1",
    role: {
      en: "Performance demos",
      "zh-CN": "效果向产品片",
      "zh-TW": "成效導向產品片",
      ja: "成果重視のデモ映像",
      ko: "성과형 데모 영상",
      ms: "Demo berprestasi",
      km: "វីដេអូសាកល្បងផ្តោតលទ្ធផល",
      th: "เดโมเน้นผลลัพธ์",
      vi: "Video demo tối ưu hiệu quả",
      fr: "Démos orientées performance",
      es: "Demos orientadas a resultados"
    },
    tags: {
      en: ["CPG", "YouTube"],
      "zh-CN": ["快消", "YouTube"],
      "zh-TW": ["快消", "YouTube"],
      ja: ["消費財", "YouTube"],
      ko: ["소비재", "YouTube"],
      ms: ["CPG", "YouTube"],
      km: ["ទំនិញប្រើប្រាស់", "YouTube"],
      th: ["สินค้าอุปโภค", "YouTube"],
      vi: ["Hàng tiêu dùng", "YouTube"],
      fr: ["Grande conso", "YouTube"],
      es: ["Consumo masivo", "YouTube"]
    },
    status: "open",
    workId: "work_1003"
  },
  {
    id: "creator_03",
    studio: "Atlas UGC Systems",
    city: "Austin",
    timezone: "GMT-5",
    role: {
      en: "UGC systems",
      "zh-CN": "UGC 批量化",
      "zh-TW": "UGC 批量化",
      ja: "UGC 制作システム",
      ko: "UGC 시스템",
      ms: "Sistem UGC",
      km: "ប្រព័ន្ធ UGC",
      th: "ระบบ UGC",
      vi: "Hệ thống UGC",
      fr: "Systèmes UGC",
      es: "Sistemas UGC"
    },
    tags: {
      en: ["DTC", "Meta"],
      "zh-CN": ["DTC", "Meta"],
      "zh-TW": ["DTC", "Meta"],
      ja: ["DTC", "Meta"],
      ko: ["DTC", "Meta"],
      ms: ["DTC", "Meta"],
      km: ["DTC", "Meta"],
      th: ["DTC", "Meta"],
      vi: ["DTC", "Meta"],
      fr: ["DTC", "Meta"],
      es: ["DTC", "Meta"]
    },
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

export function CinematicNetwork({
  locale,
  copyLocale = locale
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
}) {
  const t = cinematicText("network", copyLocale);
  const rosterLocale: MarketingLocale = copyLocale === "zh" ? "zh-CN" : copyLocale;

  return (
    <section className="bg-[#f7f7f4] py-10 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {t.title ? <MarketingEyebrowPill tone="light">{t.title}</MarketingEyebrowPill> : null}
          <h2 className={cn("text-3xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-4xl", t.title && "mt-4")}>{t.highlight}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600">{t.subtitle}</p>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4 sm:mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">{t.rosterEyebrow}</p>
          <Link href={withLocale("/creators", copyLocale)} className="text-xs text-zinc-500 hover:text-zinc-950">
            {t.viewAll}
          </Link>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
          {ROSTER.map((card) => {
            const thumb = workThumb(card.workId);
            const creator = creators.find((item) => item.id === card.id);
            const statusLabel = card.status === "active" ? t.statusActive : t.statusOpen;

            return (
              <li
                key={card.id}
                className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm"
              >
                <div className="relative h-[112px] bg-zinc-900 sm:h-auto sm:aspect-[16/8]">
                  {thumb ? (
                    <WorkCoverImage src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="absolute left-2 top-2 flex gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
                    <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-zinc-200 sm:px-2 sm:py-1 sm:text-[10px]">{statusLabel}</span>
                    <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-zinc-400 sm:px-2 sm:py-1 sm:text-[10px]">{card.timezone}</span>
                  </div>
                </div>
                <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-zinc-950 sm:text-base">{card.studio}</h3>
                      <p className="mt-0.5 truncate text-xs text-zinc-500 sm:text-sm">
                        {card.role[rosterLocale]} · {card.city}
                      </p>
                    </div>
                    {creator ? (
                      <span className="shrink-0 text-[11px] text-zinc-500 sm:text-xs">★ {creator.rating.toFixed(1)}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {card.tags[rosterLocale].map((tag) => (
                      <span key={tag} className="rounded-md border border-black/10 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:px-2 sm:text-[11px]">
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
