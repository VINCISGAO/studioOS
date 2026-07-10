import { CinematicEscrow } from "@/components/marketing/cinematic/cinematic-escrow";
import { CinematicHero } from "@/components/marketing/cinematic/cinematic-hero";
import { CinematicNav } from "@/components/marketing/cinematic/cinematic-nav";
import { CinematicNetwork } from "@/components/marketing/cinematic/cinematic-network";
import { HomePageScreen } from "@/components/marketing/cinematic/home-page-screen";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import { HomeHeroMetrics } from "@/components/marketing/home-hero-metrics";
import { LandingCostComparison } from "@/components/marketing/landing/landing-cost-comparison";
import { LandingRecentWork } from "@/components/marketing/landing/landing-recent-work";
import { LandingCta, LandingHowItWorks } from "@/components/marketing/landing/landing-sections";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { getHomeHeroSpaceBackgroundSources } from "@/lib/studioos/home-hero-space-asset";

/**
 * VINCIS marketing homepage — server-rendered shell.
 * Hero → Problem → Work → How it works → Network → Escrow → CTA → Footer
 */
export function HomeLandingPage({
  locale,
  copyLocale = locale,
  heroVideoSrc,
  featuredWorks
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  heroVideoSrc: string;
  featuredWorks: MarketingShowcaseWorkDto[];
}) {
  const { src: heroBgSrc, src2x: heroBgSrc2x } = getHomeHeroSpaceBackgroundSources();

  return (
    <div className="relative bg-black text-white">
      <CinematicNav locale={locale} copyLocale={copyLocale} />

      <main className="scroll-smooth">
        <CinematicHero locale={locale} copyLocale={copyLocale} heroBgSrc={heroBgSrc} heroBgSrc2x={heroBgSrc2x} />

        <HomeHeroVideo locale={copyLocale as MarketingLocale} videoSrc={heroVideoSrc} heroPosterSrc={heroBgSrc} />

        <HomeHeroMetrics copyLocale={copyLocale} />

        <HomePageScreen id="cost" className="bg-black py-0">
          <LandingCostComparison locale={locale} copyLocale={copyLocale} />
        </HomePageScreen>

        <HomePageScreen id="work" className="justify-start bg-[#f6f5f1] py-0">
          <LandingRecentWork locale={locale} copyLocale={copyLocale} works={featuredWorks} />
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
          <LandingCta locale={locale} copyLocale={copyLocale} />
        </HomePageScreen>
      </main>

      <MarketingFooter locale={copyLocale} tone="light" />
    </div>
  );
}
