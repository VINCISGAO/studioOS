import { HomeLandingPage } from "@/components/marketing/landing/home-landing-page";
import { getAppLanguage } from "@/lib/app-language";
import { toUiLocale } from "@/lib/app-language.shared";
import { loadHomeShowcaseWorks } from "@/lib/marketing/home-showcase-works";
import { getLanguageCode, type SearchParams } from "@/lib/i18n";
import { resolveHomeHeroVideoPlaybackSrc } from "@/lib/marketing/home-hero-video-sources";
import { toMarketingHomePortalSession } from "@/lib/marketing/portal-entry";
import { getCurrentSession } from "@/lib/session-user";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

/** Marketing homepage — presentation and conversion only. */
export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;

  const [copyLocale, featuredWorks, session] = await Promise.all([
    resolvedSearchParams.lang ? getLanguageCode(resolvedSearchParams) : getAppLanguage(),
    loadHomeShowcaseWorks(),
    getCurrentSession()
  ]);

  const locale = toUiLocale(copyLocale);
  const heroVideoSrc = resolveHomeHeroVideoPlaybackSrc(copyLocale);
  const portalSession = toMarketingHomePortalSession(session);

  return (
    <HomeLandingPage
      locale={locale}
      copyLocale={copyLocale}
      heroVideoSrc={heroVideoSrc}
      featuredWorks={featuredWorks}
      portalSession={portalSession}
    />
  );
}
