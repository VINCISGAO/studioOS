"use client";

import { CinematicEscrow } from "@/components/marketing/cinematic/cinematic-escrow";
import { CinematicHero } from "@/components/marketing/cinematic/cinematic-hero";
import { CinematicNav } from "@/components/marketing/cinematic/cinematic-nav";
import { CinematicNetwork } from "@/components/marketing/cinematic/cinematic-network";
import { HomePageScreen } from "@/components/marketing/cinematic/home-page-screen";
import { LandingCostComparison } from "@/components/marketing/landing/landing-cost-comparison";
import { LandingRecentWork } from "@/components/marketing/landing/landing-recent-work";
import { LandingCta, LandingHowItWorks, LandingWhy } from "@/components/marketing/landing/landing-sections";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import type { Locale } from "@/lib/i18n";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";

export function CinematicHomePage({
  locale,
  portalHref,
  portalLabel,
  featuredWorks,
  engagement,
  isLoggedIn = false
}: {
  locale: Locale;
  portalHref: string;
  portalLabel: string;
  featuredWorks: CreatorWork[];
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn?: boolean;
}) {
  return (
    <div className="relative bg-black text-white">
      <CinematicNav locale={locale} portalHref={portalHref} portalLabel={portalLabel} />

      <main className="scroll-smooth">
        {/* 图一 — 宇宙风 Hero */}
        <CinematicHero locale={locale} portalHref={portalHref} portalLabel={portalLabel} isLoggedIn={isLoggedIn} />

        <HomePageScreen id="why" className="bg-[#f6f5f1] py-0">
          <LandingWhy locale={locale} />
        </HomePageScreen>

        {/* 图二 — 多页式内容区 */}
        <HomePageScreen id="cost" className="bg-[#0a0a0a] py-0">
          <LandingCostComparison locale={locale} />
        </HomePageScreen>

        <HomePageScreen id="work" className="justify-start bg-[#f6f5f1] py-0">
          <LandingRecentWork locale={locale} works={featuredWorks} engagement={engagement} isLoggedIn={isLoggedIn} />
        </HomePageScreen>

        <HomePageScreen id="how-it-works" className="py-0">
          <LandingHowItWorks locale={locale} />
        </HomePageScreen>

        <HomePageScreen id="network" className="justify-start bg-[#f7f7f4] py-0">
          <CinematicNetwork locale={locale} />
        </HomePageScreen>

        <HomePageScreen id="escrow" className="py-0">
          <CinematicEscrow locale={locale} />
        </HomePageScreen>

        <HomePageScreen id="cta" className="bg-black py-0">
          <LandingCta
            locale={locale}
            portalHref={portalHref}
            portalLabel={isLoggedIn ? portalLabel : undefined}
          />
        </HomePageScreen>
      </main>

      <MarketingFooter locale={locale} tone="light" />
    </div>
  );
}
