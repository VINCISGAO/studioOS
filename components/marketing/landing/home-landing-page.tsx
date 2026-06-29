import { HomeReviewShowcase } from "@/components/marketing/home-review-showcase";
import { HomeWorkflowTabs } from "@/components/marketing/home-workflow-tabs";
import { LandingCostComparison } from "@/components/marketing/landing/landing-cost-comparison";
import { LandingHeaderNav, LandingHero } from "@/components/marketing/landing/landing-hero";
import { LandingRecentWork } from "@/components/marketing/landing/landing-recent-work";
import { LandingCta, LandingHowItWorks, LandingWhy } from "@/components/marketing/landing/landing-sections";
import { LandingStatsBar } from "@/components/marketing/landing/landing-stats-bar";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import type { Locale } from "@/lib/i18n";
import { resolveWorkThumbnail } from "@/lib/media-url";
import type { CreatorWork } from "@/lib/types";
import type { WorkEngagementSnapshot } from "@/lib/work-engagement-utils";

/** Mockup-aligned landing v4 — split hero, workflow demo, review room. */
export function HomeLandingPage({
  locale,
  portalHref,
  portalLabel,
  featuredWorks,
  engagement,
  isLoggedIn
}: {
  locale: Locale;
  portalHref: string;
  portalLabel: string;
  featuredWorks: CreatorWork[];
  engagement: Record<string, WorkEngagementSnapshot>;
  isLoggedIn: boolean;
}) {
  const spotlight = featuredWorks[0];
  const reviewPoster = spotlight
    ? resolveWorkThumbnail(spotlight.video_url, spotlight.thumbnail_url)
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <LandingHeaderNav locale={locale} isLoggedIn={isLoggedIn} portalHref={portalHref} portalLabel={portalLabel} />
      <main>
        <LandingHero locale={locale} showreelPoster={reviewPoster} isLoggedIn={isLoggedIn} portalHref={portalHref} />
        <LandingStatsBar locale={locale} />
        <LandingCostComparison locale={locale} />
        <LandingWhy locale={locale} />
        <LandingHowItWorks locale={locale} />
        <HomeWorkflowTabs locale={locale} />
        <div id="review">
          <HomeReviewShowcase
            locale={locale}
            posterSrc={reviewPoster}
            projectTitle={spotlight?.title}
          />
        </div>
        <LandingRecentWork locale={locale} works={featuredWorks} engagement={engagement} isLoggedIn={isLoggedIn} />
        <LandingCta locale={locale} portalHref={portalHref} portalLabel={isLoggedIn ? portalLabel : undefined} />
      </main>
      <MarketingFooter locale={locale} tone="dark" />
    </div>
  );
}
