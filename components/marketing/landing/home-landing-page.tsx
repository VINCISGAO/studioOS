import { CinematicHero } from "@/components/marketing/cinematic/cinematic-hero";
import { CinematicNav } from "@/components/marketing/cinematic/cinematic-nav";
import { HomeHeroVideo } from "@/components/marketing/home-hero-video";
import { HomeHeroMetrics } from "@/components/marketing/home-hero-metrics";
import {
  HomeLandingCompanionSection,
  HomeLandingCostSection,
  HomeLandingEscrowSection,
  HomeLandingHowItWorksSection,
  HomeLandingWorkSection
} from "@/components/marketing/landing/home-landing-deferred-sections";
import { MarketingHomePortalProvider } from "@/components/marketing/marketing-home-portal-context";
import { MarketingViewportGuard } from "@/components/marketing/marketing-viewport-guard";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import type { Locale, MarketingLocale } from "@/lib/i18n";
import { asMarketingLocale } from "@/lib/marketing/i18n/resolve-marketing-copy";
import type { MarketingHomePortalSession } from "@/lib/marketing/portal-entry";
import { resolveMarketingHomeWorkspaceCta } from "@/lib/marketing/portal-entry";
import { getHomeHeroSpaceBackgroundSources } from "@/lib/studioos/home-hero-space-asset";

/**
 * VINCIS marketing homepage — server-rendered shell.
 * Dark cinema (hero → companion) → warm editorial light → dark footer.
 */
export function HomeLandingPage({
  locale,
  copyLocale = locale,
  heroVideoSrc,
  companionVideoSrc = "",
  featuredWorks,
  portalSession = null,
  hydratePortalSession = false
}: {
  locale: Locale;
  copyLocale?: Locale | MarketingLocale;
  heroVideoSrc: string;
  companionVideoSrc?: string;
  featuredWorks: MarketingShowcaseWorkDto[];
  portalSession?: MarketingHomePortalSession | null;
  hydratePortalSession?: boolean;
}) {
  const { src: heroBgSrc, src2x: heroBgSrc2x } = getHomeHeroSpaceBackgroundSources();
  const workspaceCta = hydratePortalSession
    ? null
    : resolveMarketingHomeWorkspaceCta(copyLocale, portalSession);

  const page = (
    <div className="relative isolate min-h-dvh-safe overflow-x-clip bg-[#050505] text-white overscroll-y-none">
      <MarketingViewportGuard backdrop="dark" />
      <CinematicNav
        locale={locale}
        copyLocale={copyLocale}
        workspaceCta={workspaceCta}
        hydratePortalSession={hydratePortalSession}
        heroTone="light"
      />

      <main className="scroll-smooth">
        <div className="marketing-home-dark">
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

          <HomeLandingHowItWorksSection locale={locale} copyLocale={copyLocale} />

          <HomeLandingCostSection locale={locale} copyLocale={copyLocale} />

          <HomeLandingCompanionSection copyLocale={copyLocale} companionVideoSrc={companionVideoSrc} />
        </div>

        <div className="marketing-home-light">
          <HomeLandingWorkSection locale={locale} copyLocale={copyLocale} works={featuredWorks} />

          <HomeLandingEscrowSection locale={locale} copyLocale={copyLocale} />
        </div>
      </main>

      <MarketingFooter locale={asMarketingLocale(copyLocale)} />
    </div>
  );

  if (!hydratePortalSession) {
    return page;
  }

  return <MarketingHomePortalProvider copyLocale={copyLocale}>{page}</MarketingHomePortalProvider>;
}
