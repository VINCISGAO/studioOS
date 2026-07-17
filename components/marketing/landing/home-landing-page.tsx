import dynamic from "next/dynamic";
import { CinematicHero } from "@/components/marketing/cinematic/cinematic-hero";
import { CinematicNav } from "@/components/marketing/cinematic/cinematic-nav";
import { HomePageScreen } from "@/components/marketing/cinematic/home-page-screen";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import { HomeHeroMetrics } from "@/components/marketing/home-hero-metrics";
import { MarketingViewportGuard } from "@/components/marketing/marketing-viewport-guard";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { asMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";
import type { MarketingHomePortalSession } from "@/lib/marketing/portal-entry";
import { resolveMarketingHomeWorkspaceCta } from "@/lib/marketing/portal-entry";
import { getHomeHeroSpaceBackgroundSources } from "@/lib/studioos/home-hero-space-asset";

const LandingCostComparison = dynamic(
  () => import("@/components/marketing/landing/landing-cost-comparison").then((mod) => mod.LandingCostComparison),
  { loading: () => null }
);
const LandingRecentWork = dynamic(
  () => import("@/components/marketing/landing/landing-recent-work").then((mod) => mod.LandingRecentWork),
  { loading: () => null }
);
const LandingHowItWorks = dynamic(
  () => import("@/components/marketing/landing/landing-sections").then((mod) => mod.LandingHowItWorks),
  { loading: () => null }
);
const LandingCta = dynamic(
  () => import("@/components/marketing/landing/landing-sections").then((mod) => mod.LandingCta),
  { loading: () => null }
);
const CinematicNetwork = dynamic(
  () => import("@/components/marketing/cinematic/cinematic-network").then((mod) => mod.CinematicNetwork),
  { loading: () => null }
);
const CinematicEscrow = dynamic(
  () => import("@/components/marketing/cinematic/cinematic-escrow").then((mod) => mod.CinematicEscrow),
  { loading: () => null }
);
const MarketingFooter = dynamic(
  () => import("@/components/marketing/marketing-footer").then((mod) => mod.MarketingFooter),
  { loading: () => null }
);

/**
 * VINCIS marketing homepage — server-rendered shell.
 * Hero → Problem → Work → How it works → Network → Escrow → CTA → Footer
 */
export function HomeLandingPage({
  locale,
  copyLocale = locale,
  heroVideoSrc,
  featuredWorks,
  portalSession = null,
  hydratePortalSession = false
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  heroVideoSrc: string;
  featuredWorks: MarketingShowcaseWorkDto[];
  portalSession?: MarketingHomePortalSession | null;
  hydratePortalSession?: boolean;
}) {
  const { src: heroBgSrc, src2x: heroBgSrc2x } = getHomeHeroSpaceBackgroundSources();
  const workspaceCta = hydratePortalSession
    ? null
    : resolveMarketingHomeWorkspaceCta(copyLocale, portalSession);

  return (
    <div className="relative isolate min-h-dvh-safe overflow-x-clip bg-black text-white overscroll-y-none">
      <MarketingViewportGuard backdrop="dark" />
      <CinematicNav
        locale={locale}
        copyLocale={copyLocale}
        workspaceCta={workspaceCta}
        hydratePortalSession={hydratePortalSession}
        heroTone="light"
      />

      <main className="scroll-smooth">
        <CinematicHero
          locale={locale}
          copyLocale={copyLocale}
          heroBgSrc={heroBgSrc}
          heroBgSrc2x={heroBgSrc2x}
          portalSession={portalSession}
          hydratePortalSession={hydratePortalSession}
        />

        <HomeHeroVideo locale={copyLocale as MarketingLocale} videoSrc={heroVideoSrc} />

        <HomeHeroMetrics copyLocale={copyLocale} />

        <HomePageScreen id="cost" className="bg-black py-0">
          <LandingCostComparison locale={locale} copyLocale={copyLocale} />
        </HomePageScreen>

        <HomePageScreen id="work" className="justify-start bg-[#FFFFFF] py-0">
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

      <MarketingFooter locale={asMarketingLocale(copyLocale)} tone="light" />
    </div>
  );
}
