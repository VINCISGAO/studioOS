import { HomeLandingPage } from "@/components/marketing/landing/home-landing-page";
import { creatorWorks } from "@/lib/data";
import { getLanguageCode, getLocale, type SearchParams } from "@/lib/i18n";
import { resolveHomeHeroVideoPlaybackSrc } from "@/lib/marketing/home-hero-video-sources";
import {
  resolveMarketingPortalHref,
  resolveMarketingPortalLabel
} from "@/lib/marketing/portal-entry";
import { getCurrentSession } from "@/lib/session-user";
import { baseViewCount } from "@/lib/work-engagement-utils";

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const locale = getLocale(resolvedSearchParams);
  const copyLocale = getLanguageCode(resolvedSearchParams);
  const session = await getCurrentSession();
  const portalHref = resolveMarketingPortalHref(copyLocale, session);
  const portalLabel = resolveMarketingPortalLabel(copyLocale, session);
  const heroVideoSrc = resolveHomeHeroVideoPlaybackSrc(copyLocale);

  const featuredWorks = creatorWorks.filter((work) => !work.hidden).slice(0, 8);
  const engagement = Object.fromEntries(
    featuredWorks.map((work) => [
      work.id,
      { likeCount: 0, likedByMe: false, views: baseViewCount(work.id) }
    ])
  );

  return (
    <HomeLandingPage
      locale={locale}
      copyLocale={copyLocale}
      portalHref={portalHref}
      portalLabel={portalLabel}
      heroVideoSrc={heroVideoSrc}
      featuredWorks={featuredWorks}
      engagement={engagement}
      isLoggedIn={Boolean(session)}
    />
  );
}
