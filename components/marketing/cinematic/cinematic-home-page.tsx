"use client";

import { CinematicCostBreak } from "@/components/marketing/cinematic/cinematic-cost-break";
import { CinematicEscrow } from "@/components/marketing/cinematic/cinematic-escrow";
import { CinematicFilmstrip } from "@/components/marketing/cinematic/cinematic-filmstrip";
import { CinematicFinalCta } from "@/components/marketing/cinematic/cinematic-final-cta";
import { CinematicHero } from "@/components/marketing/cinematic/cinematic-hero";
import { CinematicNav } from "@/components/marketing/cinematic/cinematic-nav";
import { CinematicNetwork } from "@/components/marketing/cinematic/cinematic-network";
import { CinematicPosterWall } from "@/components/marketing/cinematic/cinematic-poster-wall";
import { MouseGlow } from "@/components/marketing/cinematic/motion-primitives";
import type { Locale } from "@/lib/i18n";
import type { CreatorWork } from "@/lib/types";

export function CinematicHomePage({
  locale,
  portalHref,
  featuredWorks
}: {
  locale: Locale;
  portalHref: string;
  featuredWorks: CreatorWork[];
}) {
  return (
    <div className="relative bg-black text-white selection:bg-violet-500/30">
      <MouseGlow />
      <CinematicNav locale={locale} />

      <main className="relative z-[2]">
        <CinematicHero locale={locale} portalHref={portalHref} />
        <CinematicCostBreak locale={locale} />
        <CinematicNetwork locale={locale} />
        <CinematicFilmstrip locale={locale} />
        <CinematicPosterWall locale={locale} works={featuredWorks} />
        <CinematicEscrow locale={locale} />
        <CinematicFinalCta locale={locale} portalHref={portalHref} />
      </main>
    </div>
  );
}
