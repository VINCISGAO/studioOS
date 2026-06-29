import { HomeLandingPage } from "@/components/marketing/landing/home-landing-page";
import { creatorWorks } from "@/lib/data";
import { getLocale, type SearchParams } from "@/lib/i18n";
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
  const locale = getLocale(await searchParams);
  const session = await getCurrentSession();
  const portalHref = resolveMarketingPortalHref(locale, session);
  const portalLabel = resolveMarketingPortalLabel(locale, session);

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
      portalHref={portalHref}
      portalLabel={portalLabel}
      featuredWorks={featuredWorks}
      engagement={engagement}
      isLoggedIn={Boolean(session)}
    />
  );
}
