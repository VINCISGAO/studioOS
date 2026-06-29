import dynamic from "next/dynamic";
import { HomeAudience } from "@/components/marketing/home-audience";
import { HomeCta } from "@/components/marketing/home-cta";
import { HomeHero } from "@/components/marketing/home-hero";
import { HomeInfrastructure } from "@/components/marketing/home-infrastructure";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { getLocale, type SearchParams } from "@/lib/i18n";
import { resolveMarketingPortalHref } from "@/lib/marketing/portal-entry";
import { getCurrentSession } from "@/lib/session-user";
import { getWorksEngagement } from "@/lib/work-engagement-service";
import { getFeaturedWorks } from "@/lib/works-catalog";

const HomePortfolioShowcase = dynamic(
  () => import("@/components/home-portfolio-showcase").then((mod) => mod.HomePortfolioShowcase),
  {
    loading: () => <div className="mx-auto h-[28rem] max-w-7xl animate-pulse rounded-2xl bg-zinc-900/40" />
  }
);

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = getLocale(await searchParams);
  const session = await getCurrentSession();
  const portalHref = resolveMarketingPortalHref(locale, session);
  const featuredWorks = await getFeaturedWorks(8);
  const userEmail = session?.email ?? null;
  const engagement = await getWorksEngagement(
    featuredWorks.map((work) => work.id),
    userEmail
  );

  return (
    <MarketingShell locale={locale}>
      <main>
        <HomeHero locale={locale} portalHref={portalHref} />
        <HomeInfrastructure locale={locale} />
        <HomePortfolioShowcase
          locale={locale}
          works={featuredWorks}
          engagement={engagement}
          isLoggedIn={Boolean(userEmail)}
        />
        <HomeAudience locale={locale} />
        <HomeCta locale={locale} portalHref={portalHref} />
      </main>
    </MarketingShell>
  );
}
