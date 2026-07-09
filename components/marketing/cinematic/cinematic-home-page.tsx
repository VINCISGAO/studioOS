"use client";

import { CinematicEscrow } from "@/components/marketing/cinematic/cinematic-escrow";
import { CinematicHero } from "@/components/marketing/cinematic/cinematic-hero";
import { CinematicNav } from "@/components/marketing/cinematic/cinematic-nav";
import { CinematicNetwork } from "@/components/marketing/cinematic/cinematic-network";
import { HomePageScreen } from "@/components/marketing/cinematic/home-page-screen";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import { LandingCostComparison } from "@/components/marketing/landing/landing-cost-comparison";
import { LandingRecentWork } from "@/components/marketing/landing/landing-recent-work";
import { LandingCta, LandingHowItWorks } from "@/components/marketing/landing/landing-sections";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";

export function CinematicHomePage({
  locale,
  copyLocale = locale,
  portalHref,
  portalLabel,
  heroVideoSrc,
  featuredWorks,
  engagement,
  isLoggedIn = false
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  portalHref: string;
  portalLabel: string;
  heroVideoSrc: string;
  featuredWorks: CreatorWork[];
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn?: boolean;
}) {
  return (
    <div className="relative bg-black text-white">
      <CinematicNav locale={locale} copyLocale={copyLocale} portalHref={portalHref} portalLabel={portalLabel} />

      <main className="scroll-smooth">
        {/* 图一 — 宇宙风 Hero */}
        <CinematicHero locale={locale} copyLocale={copyLocale} portalHref={portalHref} portalLabel={portalLabel} isLoggedIn={isLoggedIn} />

        <HomeHeroVideo locale={copyLocale} videoSrc={heroVideoSrc} />

        {/* 图二 — 多页式内容区 */}
        <HomePageScreen id="cost" className="bg-[#0a0a0a] py-0">
          <LandingCostComparison locale={locale} copyLocale={copyLocale} />
        </HomePageScreen>

        <HomePageScreen id="work" className="justify-start bg-[#f6f5f1] py-0">
          <LandingRecentWork locale={locale} copyLocale={copyLocale} works={featuredWorks} engagement={engagement} isLoggedIn={isLoggedIn} />
        </HomePageScreen>

        <HomePageScreen id="how-it-works" className="py-0">
          <LandingHowItWorks locale={locale} copyLocale={copyLocale} />
        </HomePageScreen>

        <HomePageScreen id="network" className="justify-start bg-[#f7f7f4] py-0">
          <CinematicNetwork locale={locale} copyLocale={copyLocale} />
        </HomePageScreen>

        <HomePageScreen id="escrow" className="py-0">
          <CinematicEscrow locale={locale} copyLocale={copyLocale} />
        </HomePageScreen>

        <HomePageScreen id="cta" className="bg-black py-0">
          <LandingCta
            locale={locale}
            copyLocale={copyLocale}
            portalHref={portalHref}
            portalLabel={isLoggedIn ? portalLabel : undefined}
          />
        </HomePageScreen>
      </main>

      <MarketingFooter locale={copyLocale} tone="light" />
    </div>
  );
}
