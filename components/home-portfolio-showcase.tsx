"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { CreatorPortfolioWorksGrid } from "@/components/creator/creator-profile-ui";
import { Button } from "@/components/ui/button";
import { creators } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { canEmbedVideo, sanitizeVideoUrl } from "@/lib/media-url";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";

const copy = {
  en: {
    eyebrow: "Featured studios",
    title: "Watch real ad work before you match a studio.",
    subtitle:
      "Portfolio-first discovery — browse style, platform, and category fit. Tap to play inline, then open Proposal Room.",
    viewAll: "Browse all studios"
  },
  zh: {
    eyebrow: "精选制作方作品",
    title: "匹配之前，先看真实广告作品。",
    subtitle: "作品集优先 — 按风格、平台与品类筛选。点击播放，满意后进入方案间。",
    viewAll: "浏览全部制作方"
  }
};

export function HomePortfolioShowcase({
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
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const featuredWorks = works.slice(0, 8);

  const creatorByWorkId = Object.fromEntries(
    featuredWorks
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
    <section className="border-t border-zinc-200/80 bg-[#fafaf8]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">{t.eyebrow}</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.03em] text-zinc-950 sm:text-4xl lg:text-5xl">
              {t.title}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-zinc-500 sm:text-base">{t.subtitle}</p>
          </div>
          <Button asChild variant="outline" className="h-10 shrink-0 rounded-lg px-5">
            <Link href={withLocale("/creators", locale)}>
              {t.viewAll} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <CreatorPortfolioWorksGrid
          locale={locale}
          works={featuredWorks}
          activeWorkId={activeWorkId}
          engagement={engagement}
          isLoggedIn={isLoggedIn}
          empty={locale === "zh" ? "暂无精选作品。" : "No featured works yet."}
          onActivate={handleActivate}
          creatorByWorkId={creatorByWorkId}
          columns={4}
        />
      </div>
    </section>
  );
}
